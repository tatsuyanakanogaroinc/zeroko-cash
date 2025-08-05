import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
      status
    } = body;

    // バリデーション
    if (!contractor_name || !contract_title || !contract_amount || !start_date || !end_date || !responsible_user_id) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // 少なくとも1つの分類が必要
    if (!department_id && !project_id && !event_id) {
      return NextResponse.json(
        { error: 'At least one of department, project, or event must be specified' },
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
        payment_date,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status: status || 'active',
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
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subcontract ID is required' }, { status: 400 });
    }

    // 少なくとも1つの分類が必要
    if (!department_id && !project_id && !event_id) {
      return NextResponse.json(
        { error: 'At least one of department, project, or event must be specified' },
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
        payment_date,
        department_id: department_id || null,
        project_id: project_id || null,
        event_id: event_id || null,
        category_id: category_id || null,
        responsible_user_id,
        status,
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

    const { error } = await supabaseAdmin
      .from('subcontracts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}