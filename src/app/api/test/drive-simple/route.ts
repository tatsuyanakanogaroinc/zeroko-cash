import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

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
    console.log('🧪 Google Drive簡単テスト開始');
    
    // 直接Google Drive APIを初期化
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_DRIVE_CONFIG,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // テストファイルを作成
    const testContent = 'Hello Google Drive!';
    const stream = new Readable();
    stream.push(Buffer.from(testContent));
    stream.push(null);
    
    const response = await drive.files.create({
      requestBody: {
        name: `test-file-${Date.now()}.txt`,
        parents: [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!]
      },
      media: {
        mimeType: 'text/plain',
        body: stream
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true
    });
    
    console.log('✅ ファイル作成成功:', response.data);
    
    return NextResponse.json({
      success: true,
      message: 'Google Drive簡単テスト成功',
      fileId: response.data.id,
      webViewLink: response.data.webViewLink
    });
    
  } catch (error) {
    console.error('❌ Google Drive簡単テストエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Google Drive簡単テストエラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}