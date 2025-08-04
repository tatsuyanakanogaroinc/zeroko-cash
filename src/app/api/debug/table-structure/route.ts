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

export async function GET() {
  try {
    console.log('テーブル構造確認開始');

    // expenses テーブルから1件取得してフィールドを確認
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .limit(1);

    // invoice_payments テーブルから1件取得してフィールドを確認
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .limit(1);

    console.log('Expenses テーブル構造:', expenseData);
    console.log('Invoice payments テーブル構造:', invoiceData);

    return NextResponse.json({
      success: true,
      data: {
        expenses: {
          sample: expenseData?.[0] || null,
          error: expenseError,
          fields: expenseData?.[0] ? Object.keys(expenseData[0]) : []
        },
        invoice_payments: {
          sample: invoiceData?.[0] || null,
          error: invoiceError,
          fields: invoiceData?.[0] ? Object.keys(invoiceData[0]) : []
        }
      }
    });

  } catch (error) {
    console.error('テーブル構造確認エラー:', error);
    return NextResponse.json(
      { error: 'テーブル構造の確認に失敗しました', details: error },
      { status: 500 }
    );
  }
}
