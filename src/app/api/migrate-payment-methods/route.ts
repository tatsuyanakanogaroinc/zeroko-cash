import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('データベースマイグレーション開始: payment_method制約の更新');

    // まず既存データを新しい値に更新
    const { data: currentData, error: selectError } = await supabaseAdmin
      .from('expenses')
      .select('id, payment_method')
      .in('payment_method', ['cash', 'credit_card', 'bank_transfer']);

    if (selectError) {
      console.error('既存データ取得エラー:', selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    console.log('更新対象データ:', currentData?.length || 0, '件');

    // 古い値を新しい値に更新
    if (currentData && currentData.length > 0) {
      for (const row of currentData) {
        let newPaymentMethod;
        switch (row.payment_method) {
          case 'cash':
            newPaymentMethod = 'personal_cash';
            break;
          case 'credit_card':
            newPaymentMethod = 'personal_credit';
            break;
          case 'bank_transfer':
            newPaymentMethod = 'company_cash';
            break;
          default:
            continue;
        }

        const { error: updateError } = await supabaseAdmin
          .from('expenses')
          .update({ payment_method: newPaymentMethod })
          .eq('id', row.id);

        if (updateError) {
          console.error(`行 ${row.id} の更新エラー:`, updateError);
        }
      }
    }

    // 確認用：現在のpayment_method値を取得
    const { data: distinctValues, error: confirmError } = await supabaseAdmin
      .from('expenses')
      .select('payment_method');

    if (confirmError) {
      console.error('確認クエリエラー:', confirmError);
    }

    const uniqueValues = distinctValues ? 
      [...new Set(distinctValues.map(row => row.payment_method))] : [];

    console.log('マイグレーション完了。現在のpayment_method値:', uniqueValues);

    return NextResponse.json({ 
      success: true, 
      message: 'データベースマイグレーションが完了しました',
      updatedRows: currentData?.length || 0,
      currentPaymentMethods: uniqueValues
    });

  } catch (error) {
    console.error('マイグレーションエラー:', error);
    return NextResponse.json({ 
      error: 'マイグレーション中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
