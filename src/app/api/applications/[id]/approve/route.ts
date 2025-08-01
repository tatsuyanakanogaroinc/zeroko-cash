import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, comments, type, userId } = body;

    if (!action || !type || !userId) {
      return NextResponse.json(
        { error: 'action, type, userId パラメータが必要です' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'actionは approve または reject である必要があります' },
        { status: 400 }
      );
    }

    // 却下の場合はコメント必須
    if (action === 'reject' && !comments?.trim()) {
      return NextResponse.json(
        { error: '却下の場合はコメントが必要です' },
        { status: 400 }
      );
    }

    const tableName = type === 'expense' ? 'expenses' : 'invoice_payments';
    const status = action === 'approve' ? 'approved' : 'rejected';

    // 申請の存在確認
    const { data: application, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: '申請が見つかりません' },
        { status: 404 }
      );
    }

    // 既に処理済みの申請は更新不可
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'この申請は既に処理済みです' },
        { status: 400 }
      );
    }

    // 申請のステータスを更新
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // コメントがある場合は追加（承認時は任意、却下時は必須）
    if (comments?.trim()) {
      updateData.comments = comments.trim();
    }

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('承認・却下処理エラー:', updateError);
      return NextResponse.json(
        { error: '承認・却下処理に失敗しました' },
        { status: 500 }
      );
    }

    const message = action === 'approve' ? '申請が承認されました' : '申請が却下されました';
    return NextResponse.json({ message });

  } catch (error) {
    console.error('承認・却下API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
