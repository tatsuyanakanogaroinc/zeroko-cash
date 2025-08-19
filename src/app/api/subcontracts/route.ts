import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateProratedAmountForDeletion } from '@/lib/recurring-payment-utils';
import { getGoogleSheetsService } from '@/lib/google-sheets';
import type { UnifiedExpenseData } from '@/lib/google-sheets';
import { getGoogleDriveService } from '@/lib/google-drive';
import type { UploadImageData } from '@/lib/google-drive';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractor_name,
      contract_title,
      description,
      contract_amount,
      start_date,
      end_date,
      payment_date,
      department_id,
      project_id,
      event_id,
      category_id,
      responsible_user_id,
      status,
      payment_type,
      recurring_frequency,
      recurring_day,
      payment_count,
      total_amount
    } = body;

    // バリデーション
    if (!contractor_name || !contract_title || !contract_amount || !start_date || !end_date || !responsible_user_id) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // 部門は必須
    if (!department_id || department_id === 'none' || department_id === '') {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .insert({
        contractor_name,
        contract_title,
        description,
        contract_amount: parseInt(contract_amount),
        start_date,
        end_date,
        payment_date: payment_date || null,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status: status || 'active',
        payment_type: payment_type || 'one_time',
        recurring_frequency: recurring_frequency || null,
        recurring_day: recurring_day ? parseInt(recurring_day) : null,
        payment_count: payment_count ? parseInt(payment_count) : null,
        total_amount: total_amount ? parseInt(total_amount) : parseInt(contract_amount),
      })
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      contractor_name,
      contract_title,
      description,
      contract_amount,
      start_date,
      end_date,
      payment_date,
      department_id,
      project_id,
      event_id,
      category_id,
      responsible_user_id,
      status,
      payment_type,
      recurring_frequency,
      recurring_day,
      payment_count,
      total_amount
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subcontract ID is required' }, { status: 400 });
    }

    // 部門は必須
    if (!department_id || department_id === 'none' || department_id === '') {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .update({
        contractor_name,
        contract_title,
        description,
        contract_amount: contract_amount ? parseInt(contract_amount) : undefined,
        start_date,
        end_date,
        payment_date: payment_date || null,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status,
        payment_type: payment_type || 'one_time',
        recurring_frequency: recurring_frequency || null,
        recurring_day: recurring_day ? parseInt(recurring_day) : null,
        payment_count: payment_count ? parseInt(payment_count) : null,
        total_amount: total_amount ? parseInt(total_amount) : (contract_amount ? parseInt(contract_amount) : undefined),
      })
      .eq('id', id)
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ステータスが完了または支払い待ちの場合、Google SheetsとDriveに同期
    if (data && ['completed', 'pending_payment'].includes(data.status)) {
      try {
        await syncSubcontractToGoogleSheets(data.id);
        console.log('外注データをGoogle Sheetsに同期しました:', data.id);
        
        await syncSubcontractImageToGoogleDrive(data.id);
        console.log('外注データの画像をGoogle Driveに同期しました:', data.id);
      } catch (syncError) {
        console.error('外注データのGoogle同期エラー (処理は継続):', syncError);
        // 同期エラーがあっても更新処理は成功として扱う
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subcontract ID is required' }, { status: 400 });
    }

    // 削除前に外注データを取得して、定期支払いの場合は按分計算結果を記録
    const { data: subcontract, error: fetchError } = await supabaseAdmin
      .from('subcontracts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let deletionInfo = null;
    if (subcontract.payment_type === 'recurring' && subcontract.status === 'active') {
      // 定期支払いの進行中契約を削除する場合、按分計算を実行
      try {
        const proratedResult = calculateProratedAmountForDeletion(
          subcontract.start_date,
          subcontract.end_date,
          subcontract.contract_amount,
          subcontract.recurring_frequency,
          subcontract.recurring_day
        );
        deletionInfo = {
          originalAmount: subcontract.total_amount || subcontract.contract_amount,
          paidAmount: proratedResult.paidAmount,
          removedAmount: proratedResult.remainingAmount,
          deletionDate: new Date().toISOString().split('T')[0]
        };
      } catch (error) {
        console.error('Error calculating prorated deletion for subcontract:', id, error);
      }
    }

    const { error } = await supabaseAdmin
      .from('subcontracts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      deletionInfo: deletionInfo
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 外注データをGoogle Sheetsに同期する関数
async function syncSubcontractToGoogleSheets(subcontractId: string): Promise<void> {
  // 外注の詳細情報を取得
  const { data: subcontractData, error: fetchError } = await supabaseAdmin
    .from('subcontracts')
    .select(`
      *,
      departments(name),
      categories(name),
      projects(name),
      events(name),
      users!subcontracts_responsible_user_id_fkey(name)
    `)
    .eq('id', subcontractId)
    .single();

  if (fetchError || !subcontractData) {
    throw new Error(`外注データの取得に失敗しました: ${fetchError?.message}`);
  }

  const sheetsService = getGoogleSheetsService();

  // 既に存在するかチェック
  const exists = await sheetsService.checkIfUnifiedExpenseExists(subcontractId);
  if (exists) {
    console.log(`外注 ${subcontractId} は既にスプレッドシートに存在します`);
    return;
  }

  // 外注データを統合支出データに変換
  const unifiedData: UnifiedExpenseData = {
    id: subcontractData.id,
    支出タイプ: '外注費',
    申請日: new Date(subcontractData.start_date).toLocaleDateString('ja-JP'),
    支払日: subcontractData.payment_date ? 
      new Date(subcontractData.payment_date).toLocaleDateString('ja-JP') : 
      new Date(subcontractData.end_date).toLocaleDateString('ja-JP'),
    申請者: subcontractData.users?.name || '不明',
    部署: subcontractData.departments?.name || '不明',
    金額: subcontractData.contract_amount,
    勘定科目: subcontractData.categories?.name || '外注費',
    説明: `${subcontractData.contract_title}${subcontractData.description ? ' - ' + subcontractData.description : ''}`,
    支払方法: '銀行振込',
    支払先: subcontractData.contractor_name,
    プロジェクト: subcontractData.projects?.name || '',
    イベント: subcontractData.events?.name || '',
    承認日: new Date().toLocaleDateString('ja-JP'),
    承認者: '管理者',
    ステータス: subcontractData.status === 'completed' ? '支払完了' : '承認済み',
    備考: [
      `契約期間: ${new Date(subcontractData.start_date).toLocaleDateString('ja-JP')} - ${new Date(subcontractData.end_date).toLocaleDateString('ja-JP')}`,
      subcontractData.payment_type === 'recurring' ? `定期支払い (${subcontractData.recurring_frequency})` : '一回払い'
    ].join(', ')
  };

  await sheetsService.addUnifiedExpenseToSheet(unifiedData);
}

// 外注契約の画像をGoogle Driveに同期する関数
async function syncSubcontractImageToGoogleDrive(subcontractId: string): Promise<void> {
  // 外注の詳細情報を取得
  const { data: subcontractData, error: fetchError } = await supabaseAdmin
    .from('subcontracts')
    .select(`
      *,
      departments(name),
      categories(name),
      projects(name),
      events(name),
      users!subcontracts_responsible_user_id_fkey(name)
    `)
    .eq('id', subcontractId)
    .single();

  if (fetchError || !subcontractData) {
    throw new Error(`外注データの取得に失敗しました: ${fetchError?.message}`);
  }

  // 契約書や関連書類の画像がない場合は処理をスキップ  
  if (!subcontractData.contract_image && !subcontractData.document_image) {
    console.log(`外注 ${subcontractId} には関連画像がありません。Google Drive同期をスキップします。`);
    return;
  }

  const driveService = getGoogleDriveService();

  // 契約書画像のアップロード
  if (subcontractData.contract_image) {
    try {
      await uploadSubcontractImage(
        driveService,
        subcontractData,
        subcontractData.contract_image,
        '契約書'
      );
    } catch (error) {
      console.error(`契約書画像のアップロードエラー:`, error);
    }
  }

  // 関連書類画像のアップロード
  if (subcontractData.document_image) {
    try {
      await uploadSubcontractImage(
        driveService,
        subcontractData,
        subcontractData.document_image,
        '関連書類'
      );
    } catch (error) {
      console.error(`関連書類画像のアップロードエラー:`, error);
    }
  }
}

// 外注画像アップロードのヘルパー関数
async function uploadSubcontractImage(
  driveService: any,
  subcontractData: any,
  imageUrl: string,
  documentType: string
): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`画像の取得に失敗しました: ${response.statusText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  const urlParts = imageUrl.split('/');
  const originalFileName = urlParts[urlParts.length - 1] || `${documentType}.jpg`;
  
  const uploadData: UploadImageData = {
    applicationId: subcontractData.id,
    applicantName: subcontractData.users?.name || '不明',
    applicationDate: subcontractData.start_date,
    expenseType: '外注費',
    description: `${subcontractData.contract_title}_${documentType}`,
    imageBuffer: imageBuffer,
    originalFileName: originalFileName,
    contentType: contentType
  };

  const result = await driveService.uploadImage(uploadData);
  
  console.log(`外注${documentType}をGoogle Driveにアップロードしました:`, {
    subcontractId: subcontractData.id,
    documentType: documentType,
    fileName: uploadData.fileName,
    driveFileId: result.fileId
  });
}