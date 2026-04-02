const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
    console.log("Creating bucket 'invoices'...");
    const { data: bData, error: bError } = await supabase.storage.createBucket('invoices', { public: true });
    if (bError && bError.message !== 'Bucket already exists') {
        console.error("Bucket creation failed:", bError);
    } else {
        console.log("Bucket 'invoices' is ready (Public).");
    }
}

setup();
