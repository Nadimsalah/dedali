import { createClient } from '@supabase/supabase-js';

// Load Supabase Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// You MUST set these environment variables in your Vercel/Hostinger dashboard
const WOO_API_URL = process.env.WOO_BRIDGE_API_URL || 'https://erp.didali.store/wp-json/wc/v3/';
const WOO_CONSUMER_KEY = process.env.WOO_BRIDGE_CONSUMER_KEY || '';
const WOO_CONSUMER_SECRET = process.env.WOO_BRIDGE_CONSUMER_SECRET || '';

/**
 * Pushes a local Supabase Order to the WooCommerce Bridge API
 * so the ERP system can pull it down.
 */
export async function pushOrderToWooCommerce(orderId: string) {
  try {
    // 1. Fetch Order Data from Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new Error("Order not found or Supabase error: " + error?.message);
    }
    
    // Check if it's already sent
    if (order.woo_order_id) {
      console.log(`Order ${orderId} already pushed to WooCommerce as #${order.woo_order_id}`);
      return { success: true, woo_order_id: order.woo_order_id };
    }

    // 2. Format Payload for WooCommerce REST API
    const lineItems = order.order_items?.map((item: any) => ({
      name: item.product_name || 'Custom Item',
      total: item.price?.toString() || '0',
      quantity: item.quantity || 1
    })) || [{
       name: `Order Data Ref: ${order.order_number}`,
       total: order.total?.toString() || '0',
       quantity: 1
    }];

    const wooPayload = {
      status: "processing",
      currency: "MAD",
      billing: {
        first_name: order.customer_name || 'Dedali User',
        last_name: "",
        email: order.customer_email || 'no-email@didali.store',
        phone: order.customer_phone || '',
        address_1: order.address_line1 || '',
        city: order.city || '',
        country: order.governorate || 'MA'
      },
      shipping: {
        first_name: order.customer_name || 'Dedali User',
        last_name: "",
        address_1: order.address_line1 || '',
        city: order.city || '',
        country: order.governorate || 'MA'
      },
      line_items: lineItems
    };

    // 3. Make cURL/Fetch to WooCommerce Bridge
    const authString = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');
    
    const response = await fetch(`${WOO_API_URL}orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(wooPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`WooCommerce API Error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    // 4. Update Supabase with the returned woo_id so it's not pushed again
    if (responseData.id) {
      await supabase
        .from('orders')
        .update({ woo_order_id: responseData.id })
        .eq('id', orderId);

      return { success: true, woo_order_id: responseData.id };
    }

    return { success: false, error: 'No ID returned from WooCommerce' };

  } catch (err: any) {
    console.error("Error pushing order to WooCommerce:", err);
    return { success: false, error: err.message };
  }
}
