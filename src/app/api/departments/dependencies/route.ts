import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    // Check for expenses using this department
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .or(`department_id.eq.${id},users.department_id.eq.${id}`)
      .limit(1);

    // Check for invoice payments using this department
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoice_payments')
      .select('id')
      .eq('department_id', id)
      .limit(1);

    // Check for projects in this department
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('department_id', id)
      .limit(1);

    // Check for events in this department
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('department_id', id)
      .limit(1);

    if (expensesError || invoicesError || projectsError || eventsError) {
      return NextResponse.json({ error: 'Error checking dependencies' }, { status: 500 });
    }

    const dependencies = {
      expenses: (expenses?.length || 0) + (invoices?.length || 0),
      projects: projects?.length || 0,
      events: events?.length || 0,
    };

    return NextResponse.json(dependencies);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
