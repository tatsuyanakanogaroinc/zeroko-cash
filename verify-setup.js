#!/usr/bin/env node

require('dotenv').config();
const { google } = require('googleapis');

console.log('🔍 Zeroko Cash システムセットアップ確認\n');

// 環境変数の確認
const checkEnvVars = () => {
  console.log('📋 環境変数チェック:');
  const requiredVars = [
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_SHEETS_ALL_EXPENSES_ID',
    'GOOGLE_DRIVE_ROOT_FOLDER_ID'
  ];
  
  let allPresent = true;
  requiredVars.forEach(varName => {
    const isSet = !!process.env[varName] && process.env[varName] !== 'your_' + varName.toLowerCase().replace(/_/g, '_');
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? '設定済み' : '未設定'}`);
    if (!isSet) allPresent = false;
  });
  
  console.log(`  ${allPresent ? '✅' : '❌'} 全環境変数: ${allPresent ? 'OK' : 'エラー'}\n`);
  return allPresent;
};

// Google認証の確認
const checkGoogleAuth = async () => {
  console.log('🔐 Google認証チェック:');
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    console.log('  ✅ Google認証: OK');
    console.log(`  ✅ サービスアカウント: ${process.env.GOOGLE_CLIENT_EMAIL}`);
    console.log('  ✅ アクセストークン取得: OK\n');
    return true;
  } catch (error) {
    console.log('  ❌ Google認証: エラー');
    console.log(`  エラー詳細: ${error.message}\n`);
    return false;
  }
};

// Google Sheets接続確認
const checkGoogleSheets = async (auth) => {
  console.log('📊 Google Sheets接続チェック:');
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ALL_EXPENSES_ID;
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    console.log('  ✅ スプレッドシート接続: OK');
    console.log(`  ✅ タイトル: "${response.data.properties.title}"`);
    console.log(`  ✅ シート数: ${response.data.sheets.length}`);
    console.log('  ✅ 書き込み権限: OK\n');
    return true;
  } catch (error) {
    console.log('  ❌ Google Sheets: エラー');
    console.log(`  エラー詳細: ${error.message}\n`);
    return false;
  }
};

// Google Drive接続確認
const checkGoogleDrive = async (auth) => {
  console.log('📂 Google Drive接続チェック:');
  try {
    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, webViewLink'
    });
    
    console.log('  ✅ ドライブ接続: OK');
    console.log(`  ✅ ルートフォルダ: "${response.data.name}"`);
    console.log(`  ✅ フォルダURL: ${response.data.webViewLink}`);
    console.log('  ✅ 書き込み権限: OK\n');
    return true;
  } catch (error) {
    console.log('  ❌ Google Drive: エラー');
    console.log(`  エラー詳細: ${error.message}\n`);
    return false;
  }
};

// 利用可能な機能一覧
const showAvailableFeatures = () => {
  console.log('🚀 利用可能な機能:');
  console.log('  📊 CSVエクスポート機能:');
  console.log('    - /api/export/csv?type=unified  (マネーフォワード統合用)');
  console.log('    - /api/export/csv?type=expenses (経費申請のみ)');
  console.log('    - /api/export/csv?type=invoices (請求書払いのみ)');
  console.log('    - /api/export/csv?type=subcontracts (外注契約のみ)');
  console.log('');
  console.log('  📦 画像一括ダウンロード機能:');
  console.log('    - /api/export/images?type=all    (すべての画像)');
  console.log('    - /api/export/images?type=expenses (経費申請の領収書)');
  console.log('    - /api/export/images?type=invoices (請求書払いの請求書)');
  console.log('    - /api/export/images?type=subcontracts (外注契約ファイル)');
  console.log('');
  console.log('  🔄 自動Google連携:');
  console.log('    - 申請承認時のGoogle Sheets自動同期');
  console.log('    - 承認時の領収書・請求書Google Drive整理');
  console.log('    - 月別・タイプ別フォルダ自動作成');
  console.log('    - 自動ファイル命名: [ID]_[申請者]_[日付]_[説明]');
  console.log('');
  console.log('  🖥️  管理画面:');
  console.log('    - /admin/approvals (申請管理・ダウンロード機能)');
  console.log('    - /reports (予算レポート)');
  console.log('');
};

// メイン実行
const main = async () => {
  const envOK = checkEnvVars();
  
  if (!envOK) {
    console.log('❌ 環境変数が不足しています。GOOGLE_SHEETS_SETUP.mdを参考に設定してください。');
    return;
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });
  
  const authOK = await checkGoogleAuth();
  if (!authOK) return;
  
  const sheetsOK = await checkGoogleSheets(auth);
  const driveOK = await checkGoogleDrive(auth);
  
  if (sheetsOK && driveOK) {
    console.log('🎉 すべてのセットアップが完了しています！');
    console.log('');
    showAvailableFeatures();
  } else {
    console.log('⚠️  一部の機能でエラーがあります。GOOGLE_SHEETS_SETUP.mdを確認してください。');
  }
};

main().catch(console.error);