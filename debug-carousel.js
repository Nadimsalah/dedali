
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (name) => {
    const match = env.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log("Checking table hero_carousel with ANON_KEY...");
    const { data: tables, error: tableError } = await supabase.from('hero_carousel').select('*');
    if (tableError) {
        console.error("Error fetching hero_carousel:", tableError);
    } else {
        console.log("Found", tables.length, "items in hero_carousel");
        if (tables.length > 0) {
            console.log("Sample item:", JSON.stringify(tables[0], null, 2));
            const activeCount = tables.filter(i => i.is_active).length;
            console.log("Active items count:", activeCount);
        }
    }
}

checkTable();
