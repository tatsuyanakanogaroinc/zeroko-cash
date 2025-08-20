import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CSV用のBOMを追加（Excel対応）
const BOM = '\uFEFF';

// CSVデータをエスケープする関数
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // カンマ、改行、ダブルクォートが含まれている場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 日付のフォーマット関数
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  } catch {
    return dateString;
  }
}

// 金額のフォーマット関数
function formatAmount(amount: number): string {
  if (!amount) return '0';
  return amount.toLocaleString('ja-JP');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, expenses, invoices, subcontracts, unified
    const month = searchParams.get('month'); // YYYY-MM format
    const status = searchParams.get('status'); // pending, approved, rejected

    let csvContent = '';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

    switch (type) {
      case 'expenses': {
        // 経費申請のCSVエクスポート
        let query = supabase
          .from('expenses')
          .select(`
            *,
            events:events!left(*),
            categories:categories!left(*),
            users:users!left(id, name, email, department_id, departments:departments!left(*))
          `)
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('expense_date', startDate).lte('expense_date', endDate);
        }

        const { data: expenses, error } = await query;
        
        if (error) throw error;

        // CSVヘッダー
        const headers = [
          '申請ID', '申請日', '精算日', '申請者', '部門', '説明', '金額', 
          '勘定科目', 'プロジェクト', 'イベント', '支払方法', 'ステータス', 
          'コメント', '更新日時'
        ];
        csvContent = BOM + headers.map(escapeCsvField).join(',') + '\n';

        // CSVデータ
        expenses?.forEach((expense: any) => {
          const row = [
            expense.id,
            formatDate(expense.created_at), // 申請日は作成日時
            formatDate(expense.expense_date), // 精算日
            expense.users?.name || '',
            expense.users?.departments?.name || '',
            expense.description || '',
            formatAmount(expense.amount),
            expense.categories?.name || '',
            expense.projects?.name || '',
            expense.events?.name || '',
            expense.payment_method || '',
            expense.status === 'pending' ? '承認待ち' : expense.status === 'approved' ? '承認済み' : '却下',
            expense.comments || '',
            formatDate(expense.updated_at)
          ];
          csvContent += row.map(escapeCsvField).join(',') + '\n';
        });

        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="expense_applications_${timestamp}.csv"`
          }
        });
      }

      case 'invoices': {
        // 請求書払い申請のCSVエクスポート
        let query = supabase
          .from('invoice_payments')
          .select(`
            *,
            events:events!left(*),
            categories:categories!left(*),
            departments:departments!left(*),
            projects:projects!left(*),
            users:users!left(id, name, email)
          `)
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('invoice_date', startDate).lte('invoice_date', endDate);
        }

        const { data: invoices, error } = await query;
        
        if (error) throw error;

        // CSVヘッダー
        const headers = [
          '申請ID', '申請日', '請求書日', '申請者', '部門', '目的', '金額', 
          '勘定科目', 'プロジェクト', 'イベント', '支払先', '支払方法', 
          'ステータス', 'コメント', '更新日時'
        ];
        csvContent = BOM + headers.map(escapeCsvField).join(',') + '\n';

        // CSVデータ
        invoices?.forEach((invoice: any) => {
          const row = [
            invoice.id,
            formatDate(invoice.created_at), // 申請日は作成日時
            formatDate(invoice.invoice_date), // 請求書日
            invoice.users?.name || '',
            invoice.departments?.name || '',
            invoice.purpose || '',
            formatAmount(invoice.amount),
            invoice.categories?.name || '',
            invoice.projects?.name || '',
            invoice.events?.name || '',
            invoice.vendor || '',
            invoice.payment_method || '',
            invoice.status === 'pending' ? '承認待ち' : invoice.status === 'approved' ? '承認済み' : '却下',
            invoice.comments || '',
            formatDate(invoice.updated_at)
          ];
          csvContent += row.map(escapeCsvField).join(',') + '\n';
        });

        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="invoice_payments_${timestamp}.csv"`
          }
        });
      }

      case 'subcontracts': {
        // 外注契約のCSVエクスポート
        let query = supabase
          .from('subcontracts')
          .select(`
            *,
            categories:categories!left(*),
            projects:projects!left(*),
            events:events!left(*)
          `)
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        if (month) {
          const startDate = `${month}-01`;
          const endDate = `${month}-31`;
          query = query.gte('start_date', startDate).lte('start_date', endDate);
        }

        const { data: subcontracts, error } = await query;
        
        if (error) throw error;

        // CSVヘッダー
        const headers = [
          '契約ID', '契約タイトル', '外注先', '契約金額', '支払タイプ', 
          '開始日', '終了日', '勘定科目', 'プロジェクト', 'イベント', 
          'ステータス', '説明', '作成日時', '更新日時'
        ];
        csvContent = BOM + headers.map(escapeCsvField).join(',') + '\n';

        // CSVデータ
        subcontracts?.forEach((contract: any) => {
          const row = [
            contract.id,
            contract.contract_title || '',
            contract.contractor_name || '',
            formatAmount(contract.contract_amount),
            contract.payment_type === 'one_time' ? '一回払い' : '定期支払い',
            formatDate(contract.start_date),
            formatDate(contract.end_date),
            contract.categories?.name || '',
            contract.projects?.name || '',
            contract.events?.name || '',
            contract.status === 'pending' ? '承認待ち' : 
            contract.status === 'active' ? '進行中' :
            contract.status === 'completed' ? '完了' :
            contract.status === 'pending_payment' ? '支払い待ち' : '停止/キャンセル',
            contract.description || '',
            formatDate(contract.created_at),
            formatDate(contract.updated_at)
          ];
          csvContent += row.map(escapeCsvField).join(',') + '\n';
        });

        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="subcontracts_${timestamp}.csv"`
          }
        });
      }

      case 'unified':
      case 'all':
      default: {
        // 統合CSV（全支出データ）- マネーフォワード連携用
        // status条件を動的に設定
        let expenseStatusFilter = status === 'all' ? undefined : status;
        let invoiceStatusFilter = status === 'all' ? undefined : status;
        let subcontractStatusFilter = status === 'all' ? undefined : status;
        
        const [expensesResult, invoicesResult, subcontractsResult] = await Promise.all([
          (async () => {
            let query = supabase
              .from('expenses')
              .select(`
                *,
                events:events!left(*),
                categories:categories!left(*),
                projects:projects!left(*),
                users:users!left(id, name, email),
                departments:departments!left(*),
                approved_by_user:users!expenses_approved_by_fkey(name)
              `)
              .order('expense_date', { ascending: false });
            
            if (expenseStatusFilter) {
              query = query.eq('status', expenseStatusFilter);
            }
            
            return query;
          })(),
          
          (async () => {
            let query = supabase
              .from('invoice_payments')
              .select(`
                *,
                events:events!left(*),
                categories:categories!left(*),
                departments:departments!left(*),
                projects:projects!left(*),
                users:users!left(id, name, email),
                approved_by_user:users!invoice_payments_approved_by_fkey(name)
              `)
              .order('invoice_date', { ascending: false });
            
            if (invoiceStatusFilter) {
              query = query.eq('status', invoiceStatusFilter);
            }
            
            return query;
          })(),
          
          (async () => {
            let query = supabase
              .from('subcontracts')
              .select(`
                *,
                categories:categories!left(*),
                projects:projects!left(*),
                events:events!left(*),
                approved_by_user:users!subcontracts_approved_by_fkey(name)
              `)
              .order('start_date', { ascending: false });
            
            if (subcontractStatusFilter) {
              if (subcontractStatusFilter === 'approved') {
                query = query.in('status', ['completed', 'pending_payment', 'active']);
              } else {
                query = query.eq('status', subcontractStatusFilter);
              }
            }
            
            return query;
          })()
        ]);

        if (expensesResult.error) throw expensesResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        if (subcontractsResult.error) throw subcontractsResult.error;

        // 統合データフォーマット（Google Sheetsと同じ）
        const unifiedData: any[] = [];

        // 経費申請データ
        expensesResult.data?.forEach((expense: any) => {
          unifiedData.push({
            id: expense.id,
            type: '経費申請',
            date: expense.created_at, // 申請日は作成日時
            payment_date: null, // 支払日は承認済みでもnull（まだ精算していない）
            applicant: expense.users?.name || '',
            department: expense.departments?.name || '',
            amount: expense.amount,
            category: expense.categories?.name || '',
            description: expense.description || '',
            payment_method: expense.payment_method || '',
            vendor: '',
            project: expense.projects?.name || '',
            event: expense.events?.name || '',
            approval_date: expense.status === 'approved' ? expense.approved_at : null,
            approver: expense.approved_by_user?.name || '',
            status: expense.status === 'pending' ? '承認待ち' : expense.status === 'approved' ? '承認済み' : '却下',
            comments: expense.comments || '',
            created_at: expense.created_at
          });
        });

        // 請求書払い申請データ
        invoicesResult.data?.forEach((invoice: any) => {
          unifiedData.push({
            id: invoice.id,
            type: '請求書払い',
            date: invoice.created_at, // 申請日は作成日時
            payment_date: null, // 支払日は承認済みでもnull（まだ支払いしていない）
            applicant: invoice.users?.name || '',
            department: invoice.departments?.name || '',
            amount: invoice.amount,
            category: invoice.categories?.name || '',
            description: invoice.purpose || '',
            payment_method: invoice.payment_method || '',
            vendor: invoice.vendor || '',
            project: invoice.projects?.name || '',
            event: invoice.events?.name || '',
            approval_date: invoice.status === 'approved' ? invoice.approved_at : null,
            approver: invoice.approved_by_user?.name || '',
            status: invoice.status === 'pending' ? '承認待ち' : invoice.status === 'approved' ? '承認済み' : '却下',
            comments: invoice.comments || '',
            created_at: invoice.created_at
          });
        });

        // 外注契約データ
        subcontractsResult.data?.forEach((contract: any) => {
          unifiedData.push({
            id: contract.id,
            type: '外注費',
            date: contract.created_at, // 申請日は作成日時
            payment_date: contract.status === 'completed' ? contract.end_date : null, // 完了時のみ支払日設定
            applicant: contract.contractor_name || '',
            department: '',
            amount: contract.contract_amount,
            category: contract.categories?.name || '',
            description: contract.contract_title || '',
            payment_method: contract.payment_type === 'one_time' ? '一回払い' : '定期支払い',
            vendor: contract.contractor_name || '',
            project: contract.projects?.name || '',
            event: contract.events?.name || '',
            approval_date: contract.status !== 'pending' ? contract.approved_at : null,
            approver: contract.approved_by_user?.name || '',
            status: contract.status === 'pending' ? '承認待ち' : 
                    contract.status === 'active' ? '進行中' :
                    contract.status === 'completed' ? '完了' :
                    contract.status === 'pending_payment' ? '支払い待ち' : '停止/キャンセル',
            comments: contract.description || '',
            created_at: contract.created_at
          });
        });

        // 申請日でソート
        unifiedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 月別フィルター適用
        let filteredData = unifiedData;
        if (month) {
          filteredData = unifiedData.filter(item => {
            const itemDate = new Date(item.date); // 申請日でフィルター
            const itemMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
            return itemMonth === month;
          });
        }

        // CSVヘッダー（マネーフォワード連携用の17列）
        const headers = [
          'ID', '支出タイプ', '申請日', '支払日', '申請者', '部署', '金額', 
          '勘定科目', '説明', '支払方法', '支払先', 'プロジェクト', 'イベント', 
          '承認日', '承認者', 'ステータス', '備考'
        ];
        csvContent = BOM + headers.map(escapeCsvField).join(',') + '\n';

        // CSVデータ
        filteredData.forEach((item: any) => {
          const row = [
            item.id,
            item.type,
            formatDate(item.date),
            item.payment_date ? formatDate(item.payment_date) : '', // 支払日は空の場合あり
            item.applicant,
            item.department,
            formatAmount(item.amount),
            item.category,
            item.description,
            item.payment_method,
            item.vendor,
            item.project,
            item.event,
            item.approval_date ? formatDate(item.approval_date) : '', // 承認日は空の場合あり
            item.approver,
            item.status,
            item.comments
          ];
          csvContent += row.map(escapeCsvField).join(',') + '\n';
        });

        const filename = type === 'unified' ? 
          `unified_expenses_${timestamp}.csv` : 
          `all_applications_${timestamp}.csv`;

        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        });
      }
    }

  } catch (error) {
    console.error('CSV Export Error:', error);
    return NextResponse.json(
      { error: 'CSVエクスポートに失敗しました' },
      { status: 500 }
    );
  }
}