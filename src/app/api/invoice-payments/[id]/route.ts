import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoicePaymentId = params.id;

    if (!invoicePaymentId) {
      return NextResponse.json(
        { error: '請求書払いIDが指定されていません' },
        { status: 400 }
      );
    }

    // 請求書払いデータを取得
    const { data: invoicePayment, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('id', invoicePaymentId)
      .single();

    if (error) {
      console.error('請求書払いデータの取得エラー:', error);
      return NextResponse.json(
        { error: '請求書払いデータの取得に失敗しました' },
        { status: 500 }
      );
    }

    if (!invoicePayment) {
      return NextResponse.json(
        { error: '指定された請求書払いが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoicePayment);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoicePaymentId = params.id;
    const body = await request.json();

    if (!invoicePaymentId) {
      return NextResponse.json(
        { error: '請求書払いIDが指定されていません' },
        { status: 400 }
      );
    }

    // 必須フィールドの検証
    const requiredFields = ['user_id', 'invoice_date', 'due_date', 'amount', 'vendor_name', 'category_id', 'description'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field}は必須項目です` },
          { status: 400 }
        );
      }
    }

    // 請求書払いデータを更新
    const { data: updatedInvoicePayment, error } = await supabase
      .from('invoice_payments')
      .update({
        invoice_date: body.invoice_date,
        due_date: body.due_date,
        amount: body.amount,
        vendor_name: body.vendor_name,
        category_id: body.category_id,
        description: body.description,
        payment_method: body.payment_method || 'bank_transfer',
        department_id: body.department_id || null,
        project_id: body.project_id || null,
        event_id: body.event_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoicePaymentId)
      .eq('user_id', body.user_id) // セキュリティ: 自分の請求書払いのみ更新可能
      .select()
      .single();

    if (error) {
      console.error('請求書払いデータの更新エラー:', error);
      return NextResponse.json(
        { error: '請求書払いデータの更新に失敗しました' },
        { status: 500 }
      );
    }

    if (!updatedInvoicePayment) {
      return NextResponse.json(
        { error: '更新対象の請求書払いが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedInvoicePayment);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
