import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateProratedAmountForDeletion } from '@/lib/recurring-payment-utils';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractor_name,
      contract_title,
      description,
      contract_amount,
      start_date,
      end_date,
      payment_date,
      department_id,
      project_id,
      event_id,
      category_id,
      responsible_user_id,
      status,
      payment_type,
      recurring_frequency,
      recurring_day,
      payment_count,
      total_amount
    } = body;

    // バリデーション
    if (!contractor_name || !contract_title || !contract_amount || !start_date || !end_date || !responsible_user_id) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // 部門は必須
    if (!department_id || department_id === 'none' || department_id === '') {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .insert({
        contractor_name,
        contract_title,
        description,
        contract_amount: parseInt(contract_amount),
        start_date,
        end_date,
        payment_date: payment_date || null,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status: status || 'active',
        payment_type: payment_type || 'one_time',
        recurring_frequency: recurring_frequency || null,
        recurring_day: recurring_day ? parseInt(recurring_day) : null,
        payment_count: payment_count ? parseInt(payment_count) : null,
        total_amount: total_amount ? parseInt(total_amount) : parseInt(contract_amount),
      })
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      contractor_name,
      contract_title,
      description,
      contract_amount,
      start_date,
      end_date,
      payment_date,
      department_id,
      project_id,
      event_id,
      category_id,
      responsible_user_id,
      status,
      payment_type,
      recurring_frequency,
      recurring_day,
      payment_count,
      total_amount
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subcontract ID is required' }, { status: 400 });
    }

    // 部門は必須
    if (!department_id || department_id === 'none' || department_id === '') {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('subcontracts')
      .update({
        contractor_name,
        contract_title,
        description,
        contract_amount: contract_amount ? parseInt(contract_amount) : undefined,
        start_date,
        end_date,
        payment_date: payment_date || null,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status,
        payment_type: payment_type || 'one_time',
        recurring_frequency: recurring_frequency || null,
        recurring_day: recurring_day ? parseInt(recurring_day) : null,
        payment_count: payment_count ? parseInt(payment_count) : null,
        total_amount: total_amount ? parseInt(total_amount) : (contract_amount ? parseInt(contract_amount) : undefined),
      })
      .eq('id', id)
      .select(`
        *,
        departments (
          id,
          name
        ),
        projects (
          id,
          name
        ),
        events (
          id,
          name
        ),
        categories (
          id,
          name
        ),
        users!subcontracts_responsible_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subcontract ID is required' }, { status: 400 });
    }

    // 削除前に外注データを取得して、定期支払いの場合は按分計算結果を記録
    const { data: subcontract, error: fetchError } = await supabaseAdmin
      .from('subcontracts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let deletionInfo = null;
    if (subcontract.payment_type === 'recurring' && subcontract.status === 'active') {
      // 定期支払いの進行中契約を削除する場合、按分計算を実行
      try {
        const proratedResult = calculateProratedAmountForDeletion(
          subcontract.start_date,
          subcontract.end_date,
          subcontract.contract_amount,
          subcontract.recurring_frequency,
          subcontract.recurring_day
        );
        deletionInfo = {
          originalAmount: subcontract.total_amount || subcontract.contract_amount,
          paidAmount: proratedResult.paidAmount,
          removedAmount: proratedResult.remainingAmount,
          deletionDate: new Date().toISOString().split('T')[0]
        };
      } catch (error) {
        console.error('Error calculating prorated deletion for subcontract:', id, error);
      }
    }

    const { error } = await supabaseAdmin
      .from('subcontracts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      deletionInfo: deletionInfo
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}