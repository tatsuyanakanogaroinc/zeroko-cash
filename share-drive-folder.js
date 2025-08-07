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

async function shareDriveFolder() {
  console.log('🔑 Google Driveフォルダにアクセス権を追加中...\n');
  
  try {
    // 認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_DRIVE_CONFIG,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const userEmail = 'tatsuya@zero-ko.com';
    
    if (!rootFolderId || rootFolderId === 'your_drive_root_folder_id') {
      console.error('❌ GOOGLE_DRIVE_ROOT_FOLDER_IDが設定されていません');
      return;
    }
    
    console.log(`📂 フォルダID: ${rootFolderId}`);
    console.log(`👤 共有先: ${userEmail}`);
    
    // フォルダに編集者権限を追加
    const permissionResponse = await drive.permissions.create({
      fileId: rootFolderId,
      requestBody: {
        role: 'writer',  // 編集者権限
        type: 'user',
        emailAddress: userEmail
      },
      sendNotificationEmail: false  // 通知メールを送信しない
    });
    
    console.log('✅ アクセス権の追加が完了しました！');
    
    // フォルダ情報を取得
    const folderInfo = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name, webViewLink'
    });
    
    console.log(`\n📂 フォルダ名: "${folderInfo.data.name}"`);
    console.log(`🔗 フォルダURL: ${folderInfo.data.webViewLink}`);
    console.log(`👤 ${userEmail} に編集者権限を付与しました`);
    
    console.log('\n🎉 これでGoogle Driveフォルダにアクセスできます！');
    
  } catch (error) {
    console.error('❌ アクセス権の追加に失敗しました:', error.message);
    
    if (error.message.includes('notFound')) {
      console.error('\n💡 対処法:');
      console.error('1. GOOGLE_DRIVE_ROOT_FOLDER_IDが正しいか確認');
      console.error('2. フォルダが削除されていないか確認');
    } else if (error.message.includes('insufficient')) {
      console.error('\n💡 対処法:');
      console.error('1. サービスアカウントにDrive権限があるか確認');
      console.error('2. Google Drive APIが有効化されているか確認');
    }
    
    process.exit(1);
  }
}

shareDriveFolder();