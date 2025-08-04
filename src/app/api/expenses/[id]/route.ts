import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;

    if (!expenseId) {
      return NextResponse.json(
        { error: '経費IDが指定されていません' },
        { status: 400 }
      );
    }

    // 経費データを取得
    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (error) {
      console.error('経費データの取得エラー:', error);
      return NextResponse.json(
        { error: '経費データの取得に失敗しました' },
        { status: 500 }
      );
    }

    if (!expense) {
      return NextResponse.json(
        { error: '指定された経費が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(expense);
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
    const expenseId = params.id;
    const body = await request.json();

    if (!expenseId) {
      return NextResponse.json(
        { error: '経費IDが指定されていません' },
        { status: 400 }
      );
    }

    // 必須フィールドの検証
    const requiredFields = ['user_id', 'expense_date', 'amount', 'category_id', 'description'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field}は必須項目です` },
          { status: 400 }
        );
      }
    }

    // 経費データを更新
    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update({
        expense_date: body.expense_date,
        amount: body.amount,
        category_id: body.category_id,
        description: body.description,
        payment_method: body.payment_method || 'personal_cash',
        event_id: body.event_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .eq('user_id', body.user_id) // セキュリティ: 自分の経費のみ更新可能
      .select()
      .single();

    if (error) {
      console.error('経費データの更新エラー:', error);
      return NextResponse.json(
        { error: '経費データの更新に失敗しました' },
        { status: 500 }
      );
    }

    if (!updatedExpense) {
      return NextResponse.json(
        { error: '更新対象の経費が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
