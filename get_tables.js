const { Client } = require('pg');
const url = "postgresql://postgres.uzqynyffsqmgsptxcyno:3Vrm!B7,n36g+ae@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
const client = new Client({ connectionString: url });
async function run() {
  try {
    await client.connect();
    const fs = require('fs');
    const sql = fs.readFileSync('supabase/migrations/20260924150000_rls_lockdown.sql', 'utf8');
    await client.query(sql);
    console.log("Migration applied successfully!");
    await client.end();
  } catch (e) {
    console.error(e);
  }
}
run();
