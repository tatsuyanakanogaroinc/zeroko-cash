import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ファイルをダウンロードする関数
async function downloadFile(url: string): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`);
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'unknown';
    
    return { buffer, filename };
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

// ファイル名を安全にする関数
function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, expenses, invoices, subcontracts
    const month = searchParams.get('month'); // YYYY-MM format
    const status = searchParams.get('status') || 'approved'; // 承認済みのもののみデフォルト

    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    let totalFiles = 0;
    let successfulDownloads = 0;

    switch (type) {
      case 'expenses': {
        // 経費申請の画像ファイル
        let query = supabase
          .from('expenses')
          .select('id, description, receipt_image, expense_date, users(name)')
          .not('receipt_image', 'is', null)
          .order('expense_date', { ascending: false });

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('expense_date', startDate).lte('expense_date', endDate);
        }

        const { data: expenses, error } = await query;
        if (error) throw error;

        if (expenses && expenses.length > 0) {
          const expensesFolder = zip.folder('経費申請');
          
          for (const expense of expenses) {
            if (expense.receipt_image) {
              totalFiles++;
              const fileData = await downloadFile(expense.receipt_image);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'jpg';
                const safeFilename = sanitizeFilename(
                  `${expense.id}_${expense.users?.name || '不明'}_${expense.expense_date}_${expense.description || '経費申請'}.${extension}`
                );
                expensesFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }
        break;
      }

      case 'invoices': {
        // 請求書払い申請の画像ファイル
        let query = supabase
          .from('invoice_payments')
          .select('id, purpose, receipt_image, invoice_date, users(name)')
          .not('receipt_image', 'is', null)
          .order('invoice_date', { ascending: false });

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('invoice_date', startDate).lte('invoice_date', endDate);
        }

        const { data: invoices, error } = await query;
        if (error) throw error;

        if (invoices && invoices.length > 0) {
          const invoicesFolder = zip.folder('請求書払い');
          
          for (const invoice of invoices) {
            if (invoice.receipt_image) {
              totalFiles++;
              const fileData = await downloadFile(invoice.receipt_image);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'jpg';
                const safeFilename = sanitizeFilename(
                  `${invoice.id}_${invoice.users?.name || '不明'}_${invoice.invoice_date}_${invoice.purpose || '請求書払い'}.${extension}`
                );
                invoicesFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }
        break;
      }

      case 'subcontracts': {
        // 外注契約の関連ファイル
        let query = supabase
          .from('subcontracts')
          .select('id, contract_title, contract_file, start_date, contractor_name')
          .not('contract_file', 'is', null)
          .order('start_date', { ascending: false });

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('start_date', startDate).lte('start_date', endDate);
        }

        const { data: subcontracts, error } = await query;
        if (error) throw error;

        if (subcontracts && subcontracts.length > 0) {
          const contractsFolder = zip.folder('外注契約');
          
          for (const contract of subcontracts) {
            if (contract.contract_file) {
              totalFiles++;
              const fileData = await downloadFile(contract.contract_file);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'pdf';
                const safeFilename = sanitizeFilename(
                  `${contract.id}_${contract.contractor_name || '不明'}_${contract.start_date}_${contract.contract_title || '外注契約'}.${extension}`
                );
                contractsFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }
        break;
      }

      case 'all':
      default: {
        // すべての種類のファイルを含める
        const [expensesResult, invoicesResult, subcontractsResult] = await Promise.all([
          (async () => {
            let query = supabase
              .from('expenses')
              .select('id, description, receipt_image, expense_date, users(name)')
              .not('receipt_image', 'is', null);

            if (status !== 'all') query = query.eq('status', status);
            if (month) {
              const startDate = `${month}-01`;
              const endDate = `${month}-31`;
              query = query.gte('expense_date', startDate).lte('expense_date', endDate);
            }

            return query.order('expense_date', { ascending: false });
          })(),

          (async () => {
            let query = supabase
              .from('invoice_payments')
              .select('id, purpose, receipt_image, invoice_date, users(name)')
              .not('receipt_image', 'is', null);

            if (status !== 'all') query = query.eq('status', status);
            if (month) {
              const startDate = `${month}-01`;
              const endDate = `${month}-31`;
              query = query.gte('invoice_date', startDate).lte('invoice_date', endDate);
            }

            return query.order('invoice_date', { ascending: false });
          })(),

          (async () => {
            let query = supabase
              .from('subcontracts')
              .select('id, contract_title, contract_file, start_date, contractor_name')
              .not('contract_file', 'is', null);

            if (status !== 'all') query = query.eq('status', status);
            if (month) {
              const startDate = `${month}-01`;
              const endDate = `${month}-31`;
              query = query.gte('start_date', startDate).lte('start_date', endDate);
            }

            return query.order('start_date', { ascending: false });
          })()
        ]);

        // 経費申請の画像
        if (expensesResult.data && expensesResult.data.length > 0) {
          const expensesFolder = zip.folder('経費申請');
          for (const expense of expensesResult.data) {
            if (expense.receipt_image) {
              totalFiles++;
              const fileData = await downloadFile(expense.receipt_image);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'jpg';
                const safeFilename = sanitizeFilename(
                  `${expense.id}_${expense.users?.name || '不明'}_${expense.expense_date}_${expense.description || '経費申請'}.${extension}`
                );
                expensesFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }

        // 請求書払いの画像
        if (invoicesResult.data && invoicesResult.data.length > 0) {
          const invoicesFolder = zip.folder('請求書払い');
          for (const invoice of invoicesResult.data) {
            if (invoice.receipt_image) {
              totalFiles++;
              const fileData = await downloadFile(invoice.receipt_image);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'jpg';
                const safeFilename = sanitizeFilename(
                  `${invoice.id}_${invoice.users?.name || '不明'}_${invoice.invoice_date}_${invoice.purpose || '請求書払い'}.${extension}`
                );
                invoicesFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }

        // 外注契約のファイル
        if (subcontractsResult.data && subcontractsResult.data.length > 0) {
          const contractsFolder = zip.folder('外注契約');
          for (const contract of subcontractsResult.data) {
            if (contract.contract_file) {
              totalFiles++;
              const fileData = await downloadFile(contract.contract_file);
              if (fileData) {
                const extension = fileData.filename.split('.').pop() || 'pdf';
                const safeFilename = sanitizeFilename(
                  `${contract.id}_${contract.contractor_name || '不明'}_${contract.start_date}_${contract.contract_title || '外注契約'}.${extension}`
                );
                contractsFolder?.file(safeFilename, fileData.buffer);
                successfulDownloads++;
              }
            }
          }
        }
        break;
      }
    }

    // ファイルがない場合
    if (totalFiles === 0) {
      return NextResponse.json(
        { error: '指定された条件に一致する画像ファイルがありません' },
        { status: 404 }
      );
    }

    // ダウンロード結果の情報をZIPに含める
    const summary = `ダウンロード結果:
対象ファイル数: ${totalFiles}
成功: ${successfulDownloads}
失敗: ${totalFiles - successfulDownloads}

生成日時: ${new Date().toLocaleString('ja-JP')}
フィルター条件:
- タイプ: ${type}
- 月: ${month || 'すべて'}
- ステータス: ${status}
`;
    zip.file('_ダウンロード結果.txt', summary);

    // ZIPファイルを生成
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const filename = `images_${type}_${timestamp}.zip`;

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Images Export Error:', error);
    return NextResponse.json(
      { error: '画像ファイルのダウンロードに失敗しました' },
      { status: 500 }
    );
  }
}