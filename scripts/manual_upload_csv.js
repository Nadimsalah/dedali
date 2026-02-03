
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables
// (Assumes you run this script with env vars loaded, e.g. using 'dotenv' or sourcing .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Better to use SERVICE_ROLE_KEY if available for creating data without RLS methods, 
// but allowing ANON is okay if RLS permits. 
// For admin scripts, usually SERVICE_ROLE is preferred.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || (!SUPABASE_KEY && !SUPABASE_SERVICE_KEY)) {
    console.error('Error: Missing Supabase Environment Variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

// Prefer Service Key for admin tasks to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY);

const CSV_FILE_PATH = path.join(__dirname, '../up/products_for_supabase.csv');

async function uploadProducts() {
    console.log(`Reading CSV file from: ${CSV_FILE_PATH}`);

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error('Error: File not found at', CSV_FILE_PATH);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const rows = results.data;
            console.log(`Parsed ${rows.length} rows.`);

            const validProducts = [];

            for (const row of rows) {
                // Flexible mapping based on the specific CSV structure we saw
                const title = row['title'] || row['Title'];
                if (!title) {
                    console.warn('Skipping row missing title:', row);
                    continue;
                }

                const description = row['description'] || row['Body (HTML)'] || '';
                const category = row['category'] || row['Product Category'] || 'Uncategorized';
                const price = parseFloat(row['price'] || row['Variant Price'] || '0') || 0;
                const reseller_price = parseFloat(row['reseller_price'] || row['Price HT'] || '0') || 0;
                const stock = parseInt(row['stock'] || row['Variant Inventory Qty'] || '0') || 0;
                const sku = row['sku'] || row['Variant SKU'] || `SKU-${Math.floor(Math.random() * 100000)}`;
                const image_url = row['image_url'] || row['Image Src'] || '';

                // Handle cross_sells string splitting if present
                // (Note: We don't insert cross_sells into the main products table, logic kept from UI)

                // Generate a pseudo-random slug to avoid collisions
                const slug = title.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 10000);

                const product = {
                    title,
                    description,
                    category,
                    price,
                    reseller_price,
                    compare_at_price: 0,
                    stock,
                    sku,
                    // DB expects 'images' as array
                    images: image_url ? [image_url] : [],
                    status: stock > 0 ? 'active' : 'draft',
                    // slug: slug // Exclude slug
                };

                // Prepare the payload by removing non-schema fields
                const { title: pTitle, description: pDesc, category: pCat, price: pPrice, reseller_price: pReseller, compare_at_price: pCompare, stock: pStock, sku: pSku, images: pImages, status: pStatus } = product;

                validProducts.push({
                    title: pTitle,
                    description: pDesc,
                    category: pCat,
                    price: pPrice,
                    reseller_price: pReseller,
                    compare_at_price: pCompare,
                    stock: pStock,
                    sku: pSku,
                    images: pImages,
                    status: pStatus
                });
            }

            console.log(`Prepared ${validProducts.length} valid products for upload.`);

            // Batch Insert
            const BATCH_SIZE = 50;
            let insertedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
                const batch = validProducts.slice(i, i + BATCH_SIZE);
                console.log(`Uploading batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);

                const { data, error } = await supabase
                    .from('products')
                    .insert(batch)
                    .select();

                if (error) {
                    console.error('Error uploading batch:', error.message);
                    errorCount += batch.length;
                } else {
                    insertedCount += batch.length;
                    console.log(`Batch success. inserted ${data.length} rows.`);
                }
            }

            console.log('--------------------------------------------------');
            console.log(`Upload Complete.`);
            console.log(`Success: ${insertedCount}`);
            console.log(`Failed:  ${errorCount}`);
        },
        error: (err) => {
            console.error('PapaParse Error:', err);
        }
    });
}

uploadProducts();
