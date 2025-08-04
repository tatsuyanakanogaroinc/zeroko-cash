import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'expense' or 'invoice'
    const userId = searchParams.get('userId');

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'type と userId パラメータが必要です' },
        { status: 400 }
      );
    }

    if (type === 'expense') {
      // まず申請が存在し、現在のユーザーのものか確認
      const { data: expense, error: fetchError } = await supabaseAdmin
        .from('expenses')
        .select('user_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !expense) {
        return NextResponse.json(
          { error: '経費申請が見つかりません' },
          { status: 404 }
        );
      }

      // 申請者本人または管理者のみが削除可能
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !currentUser) {
        return NextResponse.json(
          { error: 'ユーザー情報の取得に失敗しました' },
          { status: 400 }
        );
      }

      const isOwner = expense.user_id === userId;
      const isAdmin = currentUser.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: '申請の削除権限がありません' },
          { status: 403 }
        );
      }

      // 承認済み・却下済みの申請は削除不可
      if (expense.status !== 'pending') {
        return NextResponse.json(
          { error: '承認済み・却下済みの申請は削除できません' },
          { status: 400 }
        );
      }

      // 経費申請を削除
      const { error: deleteError } = await supabaseAdmin
        .from('expenses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('経費申請削除エラー:', deleteError);
        return NextResponse.json(
          { error: '経費申請の削除に失敗しました' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: '経費申請を削除しました' });

    } else if (type === 'invoice') {
      // まず申請が存在し、現在のユーザーのものか確認
      const { data: invoice, error: fetchError } = await supabaseAdmin
        .from('invoice_payments')
        .select('user_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !invoice) {
        return NextResponse.json(
          { error: '請求書払い申請が見つかりません' },
          { status: 404 }
        );
      }

      // 申請者本人または管理者のみが削除可能
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !currentUser) {
        return NextResponse.json(
          { error: 'ユーザー情報の取得に失敗しました' },
          { status: 400 }
        );
      }

      const isOwner = invoice.user_id === userId;
      const isAdmin = currentUser.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: '申請の削除権限がありません' },
          { status: 403 }
        );
      }

      // 承認済み・却下済みの申請は削除不可
      if (invoice.status !== 'pending') {
        return NextResponse.json(
          { error: '承認済み・却下済みの申請は削除できません' },
          { status: 400 }
        );
      }

      // 請求書払い申請を削除
      const { error: deleteError } = await supabaseAdmin
        .from('invoice_payments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('請求書払い申請削除エラー:', deleteError);
        return NextResponse.json(
          { error: '請求書払い申請の削除に失敗しました' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: '請求書払い申請を削除しました' });

    } else {
      return NextResponse.json(
        { error: '無効な申請タイプです' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('申請削除エラー:', error);
    return NextResponse.json(
      { error: '申請の削除に失敗しました' },
      { status: 500 }
    );
  }
}
