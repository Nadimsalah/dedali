
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

async function checkSettings() {
    console.log("Checking table admin_settings...");
    const { data: settings, error } = await supabase.from('admin_settings').select('*');
    if (error) {
        console.error("Error fetching admin_settings:", error);
    } else {
        console.log("Found", settings.length, "settings");
        settings.forEach(s => {
            console.log(`- ${s.key}: ${s.value}`);
        });
    }
}

checkSettings();
