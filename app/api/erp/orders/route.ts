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
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, 
        order_number, 
        status, 
        customer_name, 
        customer_email, 
        customer_phone, 
        address_line1, 
        city,
        governorate,
        total, 
        subtotal, 
        payment_method,
        created_at,
        order_items:order_items (
            product_id,
            product_name,
            quantity,
            price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
