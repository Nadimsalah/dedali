const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const p1 = supabase.from('customers').select('*').limit(1);
    const p2 = supabase.from('orders').select('*').limit(1);
    const p3 = supabase.from('products').select('*').limit(1);
    const [c, o, p] = await Promise.all([p1, p2, p3]);
    console.log('Customers:', c.data);
    console.log('Orders:', o.data);
    console.log('Products:', p.data);
}
run();
