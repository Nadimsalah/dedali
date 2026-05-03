import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const WOO_API_URL = process.env.WOO_BRIDGE_API_URL || '';
const WOO_CK = process.env.WOO_BRIDGE_CONSUMER_KEY || '';
const WOO_CS = process.env.WOO_BRIDGE_CONSUMER_SECRET || '';

/**
 * POST /api/woo/sync-products
 * Fetches all WooCommerce products and:
 *   - Matches them to Supabase products by SKU → updates woo_id
 *   - Inserts products that don't exist yet in Supabase
 * Body (optional): { ck?: string, cs?: string } to override env creds
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ck = body.ck || WOO_CK;
    const cs = body.cs || WOO_CS;

    if (!WOO_API_URL) {
      return NextResponse.json({ error: 'WOO_BRIDGE_API_URL not configured' }, { status: 500 });
    }
    if (!ck || !cs) {
      return NextResponse.json({ error: 'WooCommerce consumer key/secret missing. Pass them in the body as { ck, cs } or set env vars.' }, { status: 400 });
    }

    const authString = Buffer.from(`${ck}:${cs}`).toString('base64');

    // 1. Fetch all WC products (paginated)
    let page = 1;
    const perPage = 100;
    const allWooProducts: any[] = [];

    while (true) {
      const res = await fetch(
        `${WOO_API_URL}products?per_page=${perPage}&page=${page}&status=any`,
        {
          headers: { Authorization: `Basic ${authString}` }
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `WooCommerce API error ${res.status}: ${errText}` }, { status: 500 });
      }

      const batch: any[] = await res.json();
      if (!batch || batch.length === 0) break;
      allWooProducts.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    if (allWooProducts.length === 0) {
      return NextResponse.json({ success: true, message: 'No products found in WooCommerce', updated: 0, inserted: 0 });
    }

    // 2. Get all Supabase products (id + sku + woo_id)
    const { data: supabaseProducts, error: spErr } = await supabase
      .from('products')
      .select('id, sku, woo_id, title');

    if (spErr) throw spErr;

    const skuMap = new Map<string, any>(); // sku → supabase row
    const titleMap = new Map<string, any>(); // normalized title → supabase row
    for (const p of supabaseProducts || []) {
      if (p.sku) skuMap.set(p.sku.trim().toLowerCase(), p);
      if (p.title) titleMap.set(p.title.trim().toLowerCase(), p);
    }

    let updated = 0;
    let inserted = 0;
    const errors: string[] = [];

    for (const woo of allWooProducts) {
      const wooSku = (woo.sku || '').trim().toLowerCase();
      const wooTitle = (woo.name || '').trim().toLowerCase();

      // Try match by SKU first, then by title
      const match = (wooSku && skuMap.get(wooSku)) || (wooTitle && titleMap.get(wooTitle));

      if (match) {
        console.log("Found match for", wooTitle, "match id:", match.id);
        // Update product details and woo_id
        const price = parseFloat(woo.regular_price || woo.price || '0') || 0;
        const updateData = {
          woo_id: woo.id,
          price,
          stock: woo.stock_quantity ?? 0,
          status: woo.status === 'publish' ? 'active' : 'draft',
        };

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', match.id);

        if (error) {
          console.error("Update error for match", match.id, error);
          errors.push(`Failed to update ${match.id}: ${error.message}`);
        } else {
          updated++;
          match.woo_id = woo.id;
          console.log("Successfully updated match. Updated count is now", updated);
        }
      } else {
        console.log("No match found for", wooTitle, wooSku);
        // Insert as new product
        const price = parseFloat(woo.regular_price || woo.price || '0') || 0;
        const newProduct = {
          woo_id: woo.id,
          title: woo.name || 'WooCommerce Product',
          sku: woo.sku || `WOO-${woo.id}`,
          price,
          stock: woo.stock_quantity ?? 0,
          status: woo.status === 'publish' ? 'active' : 'draft',
          images: (woo.images || []).map((img: any) => img.src),
          description: (woo.description || '').replace(/(<([^>]+)>)/gi, ''),
          category: 'uncategorized',
        };

        const { error } = await supabase.from('products').insert([newProduct]);
        if (error) {
          errors.push(`Failed to insert WOO-${woo.id}: ${error.message}`);
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      total_woo_products: allWooProducts.length,
      updated,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err: any) {
    console.error('[WooSync] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
