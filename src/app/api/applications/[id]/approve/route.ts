import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleSheetsService } from '@/lib/google-sheets';
import type { UnifiedExpenseData } from '@/lib/google-sheets';
import { getGoogleDriveService } from '@/lib/google-drive';
import type { UploadImageData } from '@/lib/google-drive';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, comments, type, userId } = body;

    console.log('承認API開始:', { id, action, comments, type, userId });

    if (!action || !type || !userId) {
      console.error('必須パラメータ不足:', { action, type, userId });
      return NextResponse.json(
        { error: 'action, type, userId パラメータが必要です' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'actionは approve または reject である必要があります' },
        { status: 400 }
      );
    }

    // 却下の場合はコメント必須
    if (action === 'reject' && !comments?.trim()) {
      return NextResponse.json(
        { error: '却下の場合はコメントが必要です' },
        { status: 400 }
      );
    }

    const tableName = type === 'expense' ? 'expenses' : 'invoice_payments';
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    console.log('テーブル名:', tableName, 'ステータス:', status);

    // 申請の存在確認
    const { data: application, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('id, status')
      .eq('id', id)
      .single();

    console.log('申請検索結果:', { application, fetchError });

    if (fetchError || !application) {
      console.error('申請が見つからない:', { id, tableName, fetchError });
      return NextResponse.json(
        { error: '申請が見つかりません', details: fetchError?.message },
        { status: 404 }
      );
    }

    // 既に処理済みの申請は更新不可
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'この申請は既に処理済みです' },
        { status: 400 }
      );
    }

    // 申請のステータスを更新
    const updateData: any = {
      status
    };

    // コメントがある場合は追加（承認時は任意、却下時は必須）
    if (comments?.trim()) {
      updateData.comments = comments.trim();
    }
    
    console.log('更新データ:', updateData);

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    console.log('更新結果:', { updateError });

    if (updateError) {
      console.error('承認・却下処理エラー:', updateError);
      return NextResponse.json(
        { error: '承認・却下処理に失敗しました', details: updateError.message },
        { status: 500 }
      );
    }

    // 承認された場合はGoogle Sheetsに同期
    if (action === 'approve') {
      try {
        await syncToGoogleSheets(id, type);
        console.log('Google Sheetsへの同期が完了しました');
        
        // 承認された申請の画像をGoogle Driveに同期
        await syncImageToGoogleDrive(id, type);
        console.log('Google Driveへの画像同期が完了しました');
      } catch (syncError) {
        console.error('Google同期エラー (処理は継続):', syncError);
        // 同期エラーがあっても承認処理は成功として扱う
      }
    }

    const message = action === 'approve' ? '申請が承認されました' : '申請が却下されました';
    return NextResponse.json({ message });

  } catch (error) {
    console.error('承認・却下API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// Google Sheetsへの同期処理
async function syncToGoogleSheets(applicationId: string, type: 'expense' | 'invoice'): Promise<void> {
  const tableName = type === 'expense' ? 'expenses' : 'invoice_payments';
  
  // 承認された申請の詳細情報を取得
  const { data: applicationData, error: fetchError } = await supabaseAdmin
    .from(tableName)
    .select(`
      *,
      users(name, email, department_id),
      departments(name),
      categories(name),
      projects(name),
      events(name)
    `)
    .eq('id', applicationId)
    .single();

  if (fetchError || !applicationData) {
    throw new Error(`申請データの取得に失敗しました: ${fetchError?.message}`);
  }

  const sheetsService = getGoogleSheetsService();

  // 既に存在するかチェック
  const exists = await sheetsService.checkIfUnifiedExpenseExists(applicationId);
  if (exists) {
    console.log(`申請 ${applicationId} は既にスプレッドシートに存在します`);
    return;
  }

  // 統合支出データに変換
  const unifiedData: UnifiedExpenseData = {
    id: applicationData.id,
    支出タイプ: type === 'expense' ? '経費申請' : '請求書払い',
    申請日: type === 'expense' ? 
      new Date(applicationData.expense_date).toLocaleDateString('ja-JP') :
      new Date(applicationData.invoice_date || applicationData.created_at).toLocaleDateString('ja-JP'),
    支払日: type === 'expense' ? 
      new Date(applicationData.expense_date).toLocaleDateString('ja-JP') :
      applicationData.invoice_date ? new Date(applicationData.invoice_date).toLocaleDateString('ja-JP') : '未定',
    申請者: applicationData.users?.name || '不明',
    部署: applicationData.users?.departments?.name || applicationData.departments?.name || '不明',
    金額: applicationData.amount,
    勘定科目: applicationData.categories?.name || '不明',
    説明: applicationData.description,
    支払方法: type === 'expense' ? (applicationData.payment_method || '不明') : '銀行振込',
    支払先: type === 'expense' ? (applicationData.users?.name || '申請者') : (applicationData.vendor || '不明'),
    プロジェクト: applicationData.projects?.name || '',
    イベント: applicationData.events?.name || '',
    承認日: new Date().toLocaleDateString('ja-JP'),
    承認者: '管理者', // 実際の承認者情報があれば使用
    ステータス: '承認済み',
    備考: type === 'invoice' ? `請求書日付: ${applicationData.invoice_date ? new Date(applicationData.invoice_date).toLocaleDateString('ja-JP') : '不明'}` : ''
  };

  await sheetsService.addUnifiedExpenseToSheet(unifiedData);
}

// 承認された申請の画像をGoogle Driveに同期する関数
async function syncImageToGoogleDrive(applicationId: string, type: 'expense' | 'invoice'): Promise<void> {
  const tableName = type === 'expense' ? 'expenses' : 'invoice_payments';
  
  // 申請データと画像情報を取得
  const { data: applicationData, error: fetchError } = await supabaseAdmin
    .from(tableName)
    .select(`
      *,
      users(name, email),
      departments(name),
      categories(name),
      projects(name),
      events(name)
    `)
    .eq('id', applicationId)
    .single();

  if (fetchError || !applicationData) {
    throw new Error(`申請データの取得に失敗しました: ${fetchError?.message}`);
  }

  // 領収書画像がない場合は処理をスキップ
  if (!applicationData.receipt_image) {
    console.log(`申請 ${applicationId} には領収書画像がありません。Google Drive同期をスキップします。`);
    return;
  }

  try {
    const driveService = getGoogleDriveService();

    // Supabaseの画像URLから画像データを取得
    const imageUrl = applicationData.receipt_image;
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // ファイル名を生成
    const urlParts = imageUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1] || 'receipt.jpg';
    
    // アップロードデータを準備
    const uploadData: UploadImageData = {
      applicationId: applicationData.id,
      applicantName: applicationData.users?.name || '不明',
      applicationDate: type === 'expense' ? 
        applicationData.expense_date || applicationData.created_at :
        applicationData.invoice_date || applicationData.created_at,
      expenseType: type === 'expense' ? '経費申請' : '請求書払い',
      description: applicationData.description || '申請書類',
      imageBuffer: imageBuffer,
      fileName: originalFileName,
      mimeType: contentType
    };

    // Google Driveにアップロード
    const result = await driveService.uploadImage(uploadData);
    
    console.log(`画像をGoogle Driveにアップロードしました:`, {
      applicationId: applicationData.id,
      fileName: uploadData.fileName,
      driveFileId: result.fileId
    });

    // 必要に応じて、アップロード後のGoogle Drive URLをデータベースに保存
    // await supabaseAdmin
    //   .from(tableName)
    //   .update({ google_drive_image_url: result.webViewLink })
    //   .eq('id', applicationId);

  } catch (error) {
    console.error(`画像のGoogle Drive同期エラー (申請ID: ${applicationId}):`, error);
    throw error;
  }
}
