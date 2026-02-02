
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (name) => {
    const match = env.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function activateAll() {
    console.log("Activating all carousel items...");
    const { data, error } = await supabase
        .from('hero_carousel')
        .update({ is_active: true })
        .not('image_url', 'eq', '');

    if (error) {
        console.error("Error activating:", error);
    } else {
        console.log("Successfully activated items with images.");
    }
}

activateAll();
