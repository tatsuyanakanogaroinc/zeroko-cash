require('dotenv').config();
const { getGoogleSheetsService } = require('../lib/google-sheets');

async function setupGoogleSheetsHeaders() {
  console.log('Google Sheets統合支出データシートのヘッダーを初期化しています...');
  
  try {
    const sheetsService = getGoogleSheetsService();
    
    // 統合支出データシートのヘッダー設定
    console.log('統合支出データシートのヘッダーを設定中...');
    const result = await sheetsService.setupUnifiedExpenseSheetHeaders();
    if (result) {
      console.log('✅ 統合支出データシートのヘッダー設定完了');
      console.log('📊 設定されたヘッダー:');
      console.log('   ID | 支出タイプ | 申請日 | 支払日 | 申請者 | 部署 | 金額 | 勘定科目');
      console.log('   説明 | 支払方法 | 支払先 | プロジェクト | イベント | 承認日 | 承認者 | ステータス | 備考');
    } else {
      console.log('❌ 統合支出データシートのヘッダー設定失敗');
    }
    
    console.log('🎉 Google Sheetsの初期化が完了しました！');
    console.log('📋 これで以下の支出データが自動同期されます:');
    console.log('   • 承認された経費申請');
    console.log('   • 承認された請求書払い申請');
    console.log('   • 完了または支払い待ち状態の外注契約');
  } catch (error) {
    console.error('❌ Google Sheetsの初期化に失敗しました:', error);
    console.error('以下を確認してください:');
    console.error('1. .envファイルにGoogle Cloud Service Accountの認証情報が正しく設定されているか');
    console.error('2. 環境変数 GOOGLE_SHEETS_ALL_EXPENSES_ID にスプレッドシートIDが設定されているか');
    console.error('3. サービスアカウントがスプレッドシートへの編集権限を持っているか');
    console.error('4. スプレッドシートに「全支出データ」という名前のシートが存在するか');
    process.exit(1);
  }
}

// スクリプトが直接実行された場合にのみ実行
if (require.main === module) {
  setupGoogleSheetsHeaders();
}

module.exports = { setupGoogleSheetsHeaders };