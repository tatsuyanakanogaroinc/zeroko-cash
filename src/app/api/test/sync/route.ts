import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsService } from '@/lib/google-sheets';
import type { UnifiedExpenseData } from '@/lib/google-sheets';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Google Sheets同期テスト開始');
    
    // Google Sheetsサービステスト
    try {
      const sheetsService = getGoogleSheetsService();
      console.log('✅ Google Sheetsサービス初期化成功');
      
      // テストデータでスプレッドシート書き込みテスト
      const testData: UnifiedExpenseData = {
        id: `test-${Date.now()}`,
        支出タイプ: 'テスト申請',
        申請日: new Date().toLocaleDateString('ja-JP'),
        支払日: new Date().toLocaleDateString('ja-JP'),
        申請者: 'テストユーザー',
        部署: 'テスト部署',
        金額: 1000,
        勘定科目: 'テスト科目',
        説明: 'Google Sheets同期テスト',
        支払方法: '現金',
        支払先: 'テスト支払先',
        プロジェクト: 'テストプロジェクト',
        イベント: 'テストイベント',
        承認日: new Date().toLocaleDateString('ja-JP'),
        承認者: 'システムテスト',
        ステータス: '承認済み',
        備考: 'システム動作確認用テストデータ'
      };
      
      await sheetsService.addUnifiedExpenseToSheet(testData);
      console.log('✅ テストデータの書き込み成功');
      
      return NextResponse.json({
        success: true,
        message: 'Google Sheets同期テスト成功',
        testData: testData
      });
      
    } catch (sheetsError) {
      console.error('❌ Google Sheetsテストエラー:', sheetsError);
      return NextResponse.json({
        success: false,
        error: 'Google Sheetsテストエラー',
        details: sheetsError instanceof Error ? sheetsError.message : String(sheetsError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ 全体テストエラー:', error);
    return NextResponse.json({
      success: false,
      error: '全体テストエラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, type } = body;
    
    if (!applicationId || !type) {
      return NextResponse.json({
        success: false,
        error: 'applicationId と type が必要です'
      }, { status: 400 });
    }
    
    console.log(`🧪 実際の申請データでGoogle Sheets同期テスト: ${applicationId}`);
    
    // 実際の申請データを取得して同期テスト
    let applicationData, fetchError;
    
    if (type === 'expense') {
      const result = await supabaseAdmin
        .from('expenses')
        .select(`
          *,
          events:events!left(*),
          categories:categories!left(*),
          users:users!left(id, name, email, department_id, departments:departments!left(*))
        `)
        .eq('id', applicationId)
        .single();
      applicationData = result.data;
      fetchError = result.error;
    } else {
      const result = await supabaseAdmin
        .from('invoice_payments')
        .select(`
          *,
          events:events!left(*),
          categories:categories!left(*),
          departments:departments!left(*),
          projects:projects!left(*),
          users:users!left(id, name, email)
        `)
        .eq('id', applicationId)
        .single();
      applicationData = result.data;
      fetchError = result.error;
    }
    
    if (fetchError || !applicationData) {
      return NextResponse.json({
        success: false,
        error: '申請データが見つかりません',
        details: fetchError?.message
      }, { status: 404 });
    }
    
    console.log('申請データ:', applicationData);
    
    const sheetsService = getGoogleSheetsService();
    
    // 統合データに変換
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
      部署: type === 'expense' ? 
        (applicationData.users?.departments?.name || '不明') : 
        (applicationData.departments?.name || '不明'),
      金額: applicationData.amount,
      勘定科目: applicationData.categories?.name || '不明',
      説明: applicationData.description,
      支払方法: type === 'expense' ? (applicationData.payment_method || '不明') : '銀行振込',
      支払先: type === 'expense' ? (applicationData.users?.name || '申請者') : (applicationData.vendor || '不明'),
      プロジェクト: applicationData.projects?.name || '',
      イベント: applicationData.events?.name || '',
      承認日: new Date().toLocaleDateString('ja-JP'),
      承認者: 'テスト承認者',
      ステータス: applicationData.status || '承認済み',
      備考: type === 'invoice' ? `請求書日付: ${applicationData.invoice_date ? new Date(applicationData.invoice_date).toLocaleDateString('ja-JP') : '不明'}` : ''
    };
    
    console.log('統合データ:', unifiedData);
    
    await sheetsService.addUnifiedExpenseToSheet(unifiedData);
    
    return NextResponse.json({
      success: true,
      message: '実際の申請データでGoogle Sheets同期成功',
      applicationData: applicationData,
      unifiedData: unifiedData
    });
    
  } catch (error) {
    console.error('❌ 申請データ同期テストエラー:', error);
    return NextResponse.json({
      success: false,
      error: '申請データ同期テストエラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}