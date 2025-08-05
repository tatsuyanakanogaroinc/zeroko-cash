import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET({ params }: { params: { id: string } }) {
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
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Subcontract not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}