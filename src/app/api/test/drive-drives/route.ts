import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 利用可能な共有ドライブ一覧取得テスト開始');
    
    // 直接Google Drive APIを初期化
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_DRIVE_CONFIG,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // 共有ドライブ一覧を取得
    const response = await drive.drives.list({
      pageSize: 10
    });
    
    console.log('利用可能な共有ドライブ:', response.data.drives);
    
    return NextResponse.json({
      success: true,
      message: '共有ドライブ一覧取得成功',
      drives: response.data.drives || [],
      currentDriveId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    });
    
  } catch (error) {
    console.error('❌ 共有ドライブ一覧取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: '共有ドライブ一覧取得エラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}