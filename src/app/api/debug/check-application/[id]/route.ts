import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('申請ID確認開始:', id);

    // expensesテーブルで検索
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    // invoice_paymentsテーブルで検索
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Expenses検索結果:', { expenseData, expenseError });
    console.log('Invoice検索結果:', { invoiceData, invoiceError });

    return NextResponse.json({
      success: true,
      id,
      results: {
        expenses: {
          found: !!expenseData,
          data: expenseData,
          error: expenseError?.message
        },
        invoice_payments: {
          found: !!invoiceData,
          data: invoiceData,
          error: invoiceError?.message
        }
      }
    });

  } catch (error) {
    console.error('申請確認エラー:', error);
    return NextResponse.json(
      { error: '申請の確認に失敗しました', details: error },
      { status: 500 }
    );
  }
}
