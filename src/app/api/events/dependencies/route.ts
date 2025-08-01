import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check for expenses using this event
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('event_id', id)
      .limit(1);

    // Check for invoice payments using this event
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoice_payments')
      .select('id')
      .eq('event_id', id)
      .limit(1);

    if (expensesError || invoicesError) {
      return NextResponse.json({ error: 'Error checking dependencies' }, { status: 500 });
    }

    const dependencies = {
      expenses: (expenses?.length || 0) + (invoices?.length || 0),
      projects: 0,
      events: 0,
    };

    return NextResponse.json(dependencies);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
