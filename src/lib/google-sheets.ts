// Google Sheets API連携用のライブラリ
import { google } from 'googleapis';

// Google Sheets APIの設定
const GOOGLE_SHEETS_CONFIG = {
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

// スプレッドシートの設定
const SPREADSHEET_CONFIG = {
  // 全支出データ統合用スプレッドシート（マネーフォワード連携対応）
  ALL_EXPENSES_SHEET_ID: process.env.GOOGLE_SHEETS_ALL_EXPENSES_ID,
  ALL_EXPENSES_RANGE: 'シート1!A:Q', // A列からQ列まで（17列）
};

// マネーフォワード連携対応の統合支出データ形式
interface UnifiedExpenseData {
  id: string;
  支出タイプ: '経費申請' | '請求書払い' | '外注費';
  申請日: string;
  支払日: string;
  申請者: string;
  部署: string;
  金額: number;
  勘定科目: string;
  説明: string;
  支払方法: string;
  支払先: string;
  プロジェクト: string;
  イベント: string;
  承認日: string;
  承認者: string;
  ステータス: string;
  備考: string;
}

class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: GOOGLE_SHEETS_CONFIG,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Google Sheets認証エラー:', error);
      throw new Error('Google Sheets APIの認証に失敗しました');
    }
  }

  // 統合支出データをスプレッドシートに追加
  async addUnifiedExpenseToSheet(expenseData: UnifiedExpenseData): Promise<boolean> {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const values = [
        [
          expenseData.id,
          expenseData.支出タイプ,
          expenseData.申請日,
          expenseData.支払日,
          expenseData.申請者,
          expenseData.部署,
          expenseData.金額,
          expenseData.勘定科目,
          expenseData.説明,
          expenseData.支払方法,
          expenseData.支払先,
          expenseData.プロジェクト || '',
          expenseData.イベント || '',
          expenseData.承認日,
          expenseData.承認者,
          expenseData.ステータス,
          expenseData.備考 || ''
        ]
      ];

      const request = {
        spreadsheetId: SPREADSHEET_CONFIG.ALL_EXPENSES_SHEET_ID,
        range: SPREADSHEET_CONFIG.ALL_EXPENSES_RANGE,
        valueInputOption: 'RAW',
        resource: {
          values
        }
      };

      await this.sheets.spreadsheets.values.append(request);
      console.log('統合支出データをスプレッドシートに追加しました:', expenseData.id, expenseData.支出タイプ);
      return true;
    } catch (error) {
      console.error('スプレッドシートへの統合支出データ追加エラー:', error);
      return false;
    }
  }

  // 統合支出データシートのヘッダー行を設定
  async setupUnifiedExpenseSheetHeaders(): Promise<boolean> {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const headers = [
        'ID', '支出タイプ', '申請日', '支払日', '申請者', '部署', '金額', '勘定科目', 
        '説明', '支払方法', '支払先', 'プロジェクト', 'イベント', 
        '承認日', '承認者', 'ステータス', '備考'
      ];

      const request = {
        spreadsheetId: SPREADSHEET_CONFIG.ALL_EXPENSES_SHEET_ID,
        range: 'シート1!A1:Q1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      };

      await this.sheets.spreadsheets.values.update(request);
      console.log('統合支出データシートヘッダー設定完了');
      return true;
    } catch (error) {
      console.error('統合支出データシートヘッダー設定エラー:', error);
      return false;
    }
  }

  // 統合支出データの重複チェック
  async checkIfUnifiedExpenseExists(expenseId: string): Promise<boolean> {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_CONFIG.ALL_EXPENSES_SHEET_ID,
        range: SPREADSHEET_CONFIG.ALL_EXPENSES_RANGE
      });

      const rows = response.data.values || [];
      return rows.some((row: string[]) => row[0] === expenseId);
    } catch (error) {
      console.error('統合支出データ存在チェックエラー:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
let googleSheetsService: GoogleSheetsService | null = null;

export const getGoogleSheetsService = (): GoogleSheetsService => {
  if (!googleSheetsService) {
    googleSheetsService = new GoogleSheetsService();
  }
  return googleSheetsService;
};

export type { UnifiedExpenseData };