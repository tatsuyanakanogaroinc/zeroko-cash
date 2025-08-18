// Google Drive API連携用のライブラリ
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Google Drive APIの設定
const GOOGLE_DRIVE_CONFIG = {
  // 環境変数から取得
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

// Google Driveフォルダ設定
const DRIVE_CONFIG = {
  // ルートフォルダID（環境変数で設定）
  ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'root',
  // フォルダ構造: ルート/年/月/支出タイプ/
};

interface UploadImageData {
  applicationId: string;
  applicantName: string;
  applicationDate: string;
  expenseType: '経費申請' | '請求書払い' | '外注費';
  description: string;
  imageBuffer: Buffer;
  originalFileName: string;
  contentType: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

class GoogleDriveService {
  private auth: any;
  private drive: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: GOOGLE_DRIVE_CONFIG,
        scopes: [
          'https://www.googleapis.com/auth/drive'
        ]
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
    } catch (error) {
      console.error('Google Drive認証エラー:', error);
      throw new Error('Google Drive APIの認証に失敗しました');
    }
  }

  // 年フォルダを取得または作成
  private async getOrCreateYearFolder(year: string): Promise<string> {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      // 既存の年フォルダを検索
      const response = await this.drive.files.list({
        q: `name='${year}' and parents in '${DRIVE_CONFIG.ROOT_FOLDER_ID}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // 年フォルダを作成
      const createResponse = await this.drive.files.create({
        requestBody: {
          name: year,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [DRIVE_CONFIG.ROOT_FOLDER_ID],
          driveId: DRIVE_CONFIG.ROOT_FOLDER_ID
        },
        fields: 'id',
        supportsAllDrives: true
      });

      console.log(`年フォルダ "${year}" を作成しました`);
      return createResponse.data.id;
    } catch (error) {
      console.error(`年フォルダ "${year}" の取得/作成エラー:`, error);
      throw error;
    }
  }

  // 月フォルダを取得または作成
  private async getOrCreateMonthFolder(yearFolderId: string, month: string): Promise<string> {
    try {
      // 既存の月フォルダを検索
      const response = await this.drive.files.list({
        q: `name='${month}' and parents in '${yearFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // 月フォルダを作成
      const createResponse = await this.drive.files.create({
        requestBody: {
          name: month,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [yearFolderId]
        },
        fields: 'id',
        supportsAllDrives: true
      });

      console.log(`月フォルダ "${month}" を作成しました`);
      return createResponse.data.id;
    } catch (error) {
      console.error(`月フォルダ "${month}" の取得/作成エラー:`, error);
      throw error;
    }
  }

  // 支出タイプフォルダを取得または作成
  private async getOrCreateExpenseTypeFolder(monthFolderId: string, expenseType: string): Promise<string> {
    try {
      // 既存の支出タイプフォルダを検索
      const response = await this.drive.files.list({
        q: `name='${expenseType}' and parents in '${monthFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // 支出タイプフォルダを作成
      const createResponse = await this.drive.files.create({
        requestBody: {
          name: expenseType,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [monthFolderId]
        },
        fields: 'id',
        supportsAllDrives: true
      });

      console.log(`支出タイプフォルダ "${expenseType}" を作成しました`);
      return createResponse.data.id;
    } catch (error) {
      console.error(`支出タイプフォルダ "${expenseType}" の取得/作成エラー:`, error);
      throw error;
    }
  }

  // 画像をGoogle Driveにアップロード
  async uploadImage(uploadData: UploadImageData): Promise<{ fileId: string; webViewLink: string }> {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const date = new Date(uploadData.applicationDate);
      const year = date.getFullYear().toString();
      const month = `${String(date.getMonth() + 1).padStart(2, '0')}月`;

      // フォルダ階層を作成
      const yearFolderId = await this.getOrCreateYearFolder(year);
      const monthFolderId = await this.getOrCreateMonthFolder(yearFolderId, month);
      const expenseTypeFolderId = await this.getOrCreateExpenseTypeFolder(monthFolderId, uploadData.expenseType);

      // ファイル名を生成（[申請ID]_[申請者]_[日付]_[説明]）
      const dateStr = date.toLocaleDateString('ja-JP').replace(/\//g, '-');
      const sanitizedDescription = uploadData.description.replace(/[^\w\s-]/g, '').substring(0, 50);
      const fileExtension = path.extname(uploadData.originalFileName);
      const newFileName = `${uploadData.applicationId}_${uploadData.applicantName}_${dateStr}_${sanitizedDescription}${fileExtension}`;

      console.log('Google Driveアップロード準備:', {
        fileName: newFileName,
        contentType: uploadData.contentType,
        bufferSize: uploadData.imageBuffer.length,
        expenseType: uploadData.expenseType
      });

      // BufferをReadableStreamに変換
      const stream = new Readable();
      stream.push(uploadData.imageBuffer);
      stream.push(null);

      // 画像をアップロード
      const response = await this.drive.files.create({
        requestBody: {
          name: newFileName,
          parents: [expenseTypeFolderId]
        },
        media: {
          mimeType: uploadData.contentType,
          body: stream
        },
        fields: 'id, webViewLink',
        supportsAllDrives: true
      });

      console.log(`画像をアップロードしました: ${newFileName} -> フォルダ: ${year}/${month}/${uploadData.expenseType}`);

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink
      };
    } catch (error) {
      console.error('Google Driveへの画像アップロードエラー:', error);
      throw new Error('画像のアップロードに失敗しました');
    }
  }

  // フォルダ構造の表示（デバッグ用）
  async listFolderStructure(): Promise<void> {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      console.log('📁 Google Drive フォルダ構造:');
      
      const response = await this.drive.files.list({
        q: `parents in '${DRIVE_CONFIG.ROOT_FOLDER_ID}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      for (const yearFolder of response.data.files || []) {
        console.log(`📂 ${yearFolder.name}/`);
        
        const monthsResponse = await this.drive.files.list({
          q: `parents in '${yearFolder.id}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          orderBy: 'name',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });

        for (const monthFolder of monthsResponse.data.files || []) {
          console.log(`  📂 ${monthFolder.name}/`);
          
          const typesResponse = await this.drive.files.list({
            q: `parents in '${monthFolder.id}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
          });

          for (const typeFolder of typesResponse.data.files || []) {
            const filesResponse = await this.drive.files.list({
              q: `parents in '${typeFolder.id}' and trashed=false`,
              fields: 'files(id, name)',
              orderBy: 'name',
              supportsAllDrives: true,
              includeItemsFromAllDrives: true
            });
            
            console.log(`    📂 ${typeFolder.name}/ (${filesResponse.data.files?.length || 0}ファイル)`);
          }
        }
      }
    } catch (error) {
      console.error('フォルダ構造の取得エラー:', error);
    }
  }
}

// シングルトンインスタンス
let googleDriveService: GoogleDriveService | null = null;

export const getGoogleDriveService = (): GoogleDriveService => {
  if (!googleDriveService) {
    googleDriveService = new GoogleDriveService();
  }
  return googleDriveService;
};

export type { UploadImageData, DriveFolder };