import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/google-drive';
import type { UploadImageData } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Google Drive同期テスト開始');
    
    const driveService = getGoogleDriveService();
    
    // テスト用の画像データを作成（小さなテストファイル）
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==', 'base64');
    
    const uploadData: UploadImageData = {
      applicationId: `test-${Date.now()}`,
      applicantName: 'テストユーザー',
      applicationDate: new Date().toISOString().split('T')[0],
      expenseType: '経費申請',
      description: 'Google Drive同期テスト',
      imageBuffer: testImageBuffer,
      contentType: 'image/png',
      originalFileName: 'test-receipt.png'
    };
    
    const result = await driveService.uploadImage(uploadData);
    
    return NextResponse.json({
      success: true,
      message: 'Google Drive同期テスト成功',
      fileId: result.fileId,
      webViewLink: result.webViewLink
    });
    
  } catch (error) {
    console.error('❌ Google Driveテストエラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Google Driveテストエラー',
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
    
    console.log(`🧪 実際の申請データでGoogle Drive同期テスト: ${applicationId}`);
    
    // この部分では実際の画像同期処理をテストする
    // （実装は承認APIの syncImageToGoogleDrive 関数と同じロジック）
    
    return NextResponse.json({
      success: true,
      message: '実装中：実際の申請データでGoogle Drive同期'
    });
    
  } catch (error) {
    console.error('❌ 申請データGoogle Drive同期テストエラー:', error);
    return NextResponse.json({
      success: false,
      error: '申請データGoogle Drive同期テストエラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}