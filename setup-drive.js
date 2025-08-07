require('dotenv').config();
const { google } = require('googleapis');

// Google Drive APIの設定
const GOOGLE_DRIVE_CONFIG = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
};

async function setupGoogleDrive() {
  console.log('🚀 Google Drive画像整理システムのセットアップを実行中...\n');
  
  try {
    // 認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_DRIVE_CONFIG,
      scopes: [
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });
    
    console.log('✅ Google Drive認証成功!');
    
    // ルートフォルダの作成（または確認）
    let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    
    if (!rootFolderId || rootFolderId === 'root' || rootFolderId === 'your_drive_root_folder_id') {
      console.log('📁 支出管理用ルートフォルダを作成中...');
      
      const folderResponse = await drive.files.create({
        requestBody: {
          name: '支出管理_領収書・請求書',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id, webViewLink'
      });
      
      rootFolderId = folderResponse.data.id;
      console.log(`✅ ルートフォルダを作成しました: ${folderResponse.data.webViewLink}`);
      console.log(`📝 環境変数に以下を追加してください:`);
      console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${rootFolderId}`);
    } else {
      // 既存フォルダの確認
      try {
        const folderInfo = await drive.files.get({
          fileId: rootFolderId,
          fields: 'id, name, webViewLink'
        });
        console.log(`✅ 既存のルートフォルダを確認: "${folderInfo.data.name}"`);
        console.log(`📂 フォルダURL: ${folderInfo.data.webViewLink}`);
      } catch (error) {
        console.error('❌ 指定されたルートフォルダが見つかりません');
        console.error('正しいフォルダIDを環境変数に設定してください');
        return;
      }
    }
    
    // テスト用フォルダ構造の作成
    console.log('\n📂 テスト用フォルダ構造を作成中...');
    
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}月`;
    
    // 年フォルダを作成
    const yearFolder = await drive.files.create({
      requestBody: {
        name: currentYear,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId]
      },
      fields: 'id'
    });
    
    // 月フォルダを作成
    const monthFolder = await drive.files.create({
      requestBody: {
        name: currentMonth,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [yearFolder.data.id]
      },
      fields: 'id'
    });
    
    // 支出タイプフォルダを作成
    const expenseTypes = ['経費申請', '請求書払い', '外注費'];
    
    for (const expenseType of expenseTypes) {
      await drive.files.create({
        requestBody: {
          name: expenseType,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [monthFolder.data.id]
        },
        fields: 'id'
      });
      console.log(`  📁 ${currentYear}/${currentMonth}/${expenseType}/`);
    }
    
    console.log('\n🎉 Google Drive画像整理システムのセットアップが完了しました!');
    
    console.log('\n📊 フォルダ構造:');
    console.log(`📂 支出管理_領収書・請求書/`);
    console.log(`  📂 ${currentYear}/`);
    console.log(`    📂 ${currentMonth}/`);
    console.log(`      📂 経費申請/`);
    console.log(`      📂 請求書払い/`);
    console.log(`      📂 外注費/`);
    
    console.log('\n🚀 これで以下が自動実行されます:');
    console.log('   • 申請承認時に領収書画像が月別・タイプ別に整理');
    console.log('   • 外注完了時に契約書・関連書類が月別に整理');
    console.log('   • ファイル名は [申請ID]_[申請者]_[日付]_[説明] で自動命名');
    
    // 必要なGoogle Cloud APIの確認
    console.log('\n⚠️  重要: 以下のAPIが有効化されていることを確認してください:');
    console.log('   1. Google Sheets API (既に有効化済み)');
    console.log('   2. Google Drive API (新たに有効化が必要)');
    
    console.log('\n🔧 Google Drive API有効化手順:');
    console.log('   1. https://console.cloud.google.com/ にアクセス');
    console.log('   2. APIとサービス > ライブラリ');
    console.log('   3. "Google Drive API" を検索して有効化');
    
    if (!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID === 'your_drive_root_folder_id') {
      console.log(`\n📝 .envファイルに以下を追加してください:`);
      console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${rootFolderId}`);
    }
    
  } catch (error) {
    console.error('❌ セットアップに失敗しました:', error.message);
    
    if (error.message.includes('insufficient permissions')) {
      console.error('\n🔍 権限エラーの対処法:');
      console.error('1. Google Drive APIが有効化されているか確認');
      console.error('2. サービスアカウントに適切な権限があるか確認');
    } else if (error.message.includes('invalid_grant')) {
      console.error('\n🔍 認証エラーの対処法:');
      console.error('1. GOOGLE_PRIVATE_KEYの値が正しいか確認');
      console.error('2. 改行文字(\\n)が含まれているか確認');
    }
    
    process.exit(1);
  }
}

setupGoogleDrive();