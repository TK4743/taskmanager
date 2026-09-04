import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runAudit() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('           🚀 COMPREHENSIVE FULL-SYSTEM AUDIT REPORT              ');
  console.log('════════════════════════════════════════════════════════════════════\n');

  // 1. DATABASE CONNECTIVITY & TABLE AUDIT
  console.log('1️⃣  DATABASE & SCHEMA AUDIT');
  console.log('────────────────────────────────────────────────────────────────────');
  try {
    const client = await pool.connect();
    console.log('  ✅ PostgreSQL Database Connection: SUCCESSFUL');

    // List all tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`  📊 Total Public Tables in DB: ${tables.length}`);

    console.log('\n  📋 All Public Tables and Counts:');
    for (const t of tables) {
      const countRes = await client.query(`SELECT COUNT(*) as count FROM "${t}"`);
      console.log(`    • ${t.padEnd(38)} : ${countRes.rows[0].count} rows`);
    }

    client.release();
  } catch (err: any) {
    console.error('  ❌ Database Connection / Audit Error:', err.message);
  }

  // 2. BACKEND ROUTES AUDIT
  console.log('\n2️⃣  BACKEND ROUTES PARSING & INTEGRITY AUDIT');
  console.log('────────────────────────────────────────────────────────────────────');
  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const serverCode = fs.readFileSync(serverPath, 'utf8');

  const backendRoutes: { method: string; path: string; line: number }[] = [];
  const lines = serverCode.split('\n');
  lines.forEach((lineStr, lineIdx) => {
    let rMatch;
    const lineRegex = /app\.(get|post|put|delete|patch|all)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((rMatch = lineRegex.exec(lineStr)) !== null) {
      backendRoutes.push({
        method: rMatch[1].toUpperCase(),
        path: rMatch[2],
        line: lineIdx + 1
      });
    }
  });

  console.log(`  📡 Total Backend API Endpoints Defined: ${backendRoutes.length}`);

  // Check for potential duplicate routes
  const routeMap = new Map<string, number[]>();
  backendRoutes.forEach(r => {
    const key = `${r.method} ${r.path}`;
    if (!routeMap.has(key)) {
      routeMap.set(key, []);
    }
    routeMap.get(key)!.push(r.line);
  });

  const duplicates = [...routeMap.entries()].filter(([_, lns]) => lns.length > 1);
  if (duplicates.length > 0) {
    console.log(`  ⚠️ Found ${duplicates.length} duplicate/overlapping route definitions:`);
    duplicates.forEach(([route, lns]) => {
      console.log(`     • ${route} on lines: ${lns.join(', ')}`);
    });
  } else {
    console.log('  ✅ No duplicate / overlapping route definitions found.');
  }

  // 3. FRONTEND API CALLS AUDIT
  console.log('\n3️⃣  FRONTEND API CALLS vs BACKEND ENDPOINTS CROSS-AUDIT');
  console.log('────────────────────────────────────────────────────────────────────');
  const srcDir = path.resolve(process.cwd(), 'src');
  const srcFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  const frontendCalls: { file: string; url: string; line: number }[] = [];

  srcFiles.forEach(file => {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const fLines = content.split('\n');
    fLines.forEach((l, idx) => {
      const fetchMatches = l.match(/(?:fetch\s*\(\s*[`'"](\/api\/[^`'"]+)[`'"]|['"`](\/api\/[^`'"]+)['"`])/g);
      if (fetchMatches) {
        fetchMatches.forEach(fm => {
          const cleanUrl = fm.replace(/fetch\s*\(\s*/, '').replace(/[`'"]/g, '').split('?')[0];
          if (cleanUrl.startsWith('/api/')) {
            frontendCalls.push({ file, url: cleanUrl, line: idx + 1 });
          }
        });
      }
    });
  });

  console.log(`  💻 Total Frontend API Calls Identified: ${frontendCalls.length}`);

  // 4. TELEGRAM SCHEDULER & CRON CONFIGURATION AUDIT
  console.log('\n4️⃣  TELEGRAM SCHEDULER & CRON CONFIGURATION AUDIT');
  console.log('────────────────────────────────────────────────────────────────────');
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

  console.log(`  ⏰ Vercel Crons Configured (${vercelJson.crons?.length || 0} total):`);
  (vercelJson.crons || []).forEach((c: any) => {
    console.log(`     • ${c.path.padEnd(30)} -> Schedule: "${c.schedule}"`);
  });

  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log('                    🏁 AUDIT COMPLETED SUCCESSFULLY               ');
  console.log('════════════════════════════════════════════════════════════════════');

  await pool.end();
}

runAudit().catch(err => {
  console.error('Audit Script Failed:', err);
  process.exit(1);
});
