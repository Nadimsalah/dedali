import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET(request: Request) {
  // Authorization check
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.ERP_API_KEY || 'dedali-secret-key-123';
  
  if (!authHeader || !authHeader.includes(expectedKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, role, status, company_name, total_orders, total_spent, city, created_at');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'success',
      count: customers.length,
      data: customers
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
