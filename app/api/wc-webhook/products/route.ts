import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WOO_WEBHOOK_SECRET = process.env.WOO_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    const signature = headers['x-wc-webhook-signature'] || '';
    const event = headers['x-wc-webhook-event'] || ''; // e.g. 'created', 'updated'

    // Validate Signature if Secret is provided
    if (WOO_WEBHOOK_SECRET) {
      const generatedSignature = crypto
        .createHmac('sha256', WOO_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('base64');
        
      if (generatedSignature !== signature) {
        return NextResponse.json({ error: 'Unauthorized: Invalid Signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(rawBody);
    const wooId = data?.id;

    if (!wooId) {
       return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
    }

    if (event === 'deleted') {
      await supabase.from('products').delete().eq('woo_id', wooId);
      return NextResponse.json({ status: 'success', message: 'Product deleted' });
    }

    if (event === 'created' || event === 'updated') {
      // Map WooCommerce Product to Supabase Product
      // Important: adjust the fallback values according to your Supabase default validations
      const price = data.regular_price || data.price || 0;
      const sku = data.sku || `WOO-${wooId}`;
      const title = data.name || 'Synced Product';
      
      const payload = {
         woo_id: wooId,
         title: title,
         sku: sku,
         price: parseFloat(price),
         stock: data.stock_quantity ?? 0,
         status: 'active',
         images: data.images?.map((img: any) => img.src) || [],
         description: data.description?.replace(/(<([^>]+)>)/gi, "") || '' // strip tags visually for basic sync
      };

      // Check if it already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('woo_id', wooId)
        .single();

      if (existingProduct) {
        // Update
        await supabase
          .from('products')
          .update(payload)
          .eq('woo_id', wooId);
      } else {
        // Insert
        await supabase
          .from('products')
          .insert([payload]);
      }
      
      return NextResponse.json({ status: 'success', message: `Product ${wooId} synced` });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (err: any) {
    console.error("WooCommerce Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
