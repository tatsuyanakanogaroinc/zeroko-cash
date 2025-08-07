require('dotenv').config();
const { google } = require('googleapis');

async function testAuth() {
  console.log('🔍 認証情報をテスト中...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
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
      },
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    console.log('✅ 認証設定OK');
    
    // トークン取得テスト
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    console.log('✅ アクセストークン取得成功');
    console.log('📧 サービスアカウントメール:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('🔑 トークン取得成功:', accessToken.token ? '✅' : '❌');
    
    // Drive API テスト
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.about.get({ fields: 'user' });
    
    console.log('✅ Google Drive API接続成功');
    console.log('👤 接続ユーザー:', response.data.user?.emailAddress);
    
  } catch (error) {
    console.error('❌ 認証テストエラー:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 対処法:');
      console.error('1. GOOGLE_PRIVATE_KEYの改行文字が正しいか確認');
      console.error('2. 新しいサービスアカウントキーを生成');
    } else if (error.message.includes('insufficient')) {
      console.error('\n💡 対処法:');
      console.error('1. Google Drive APIが有効化されているか確認');
      console.error('2. サービスアカウントに適切な権限があるか確認');
    }
  }
}

testAuth();