import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Google Drive共有ドライブ内容確認テスト開始');
    
    const driveService = getGoogleDriveService();
    
    // 共有ドライブの内容を直接確認
    await driveService.listFolderStructure();
    
    return NextResponse.json({
      success: true,
      message: 'Google Drive共有ドライブ内容確認完了（ログを確認してください）'
    });
    
  } catch (error) {
    console.error('❌ Google Drive内容確認エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Google Drive内容確認エラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}