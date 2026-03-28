/**
 * Open psql using DATABASE_URL from backend/.env
 * Requires PostgreSQL client tools (psql) on PATH.
 */
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL in backend/.env');
  process.exit(1);
}

console.log('psql (type \\q to exit)\n');
const child = spawn('psql', [url], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code == null ? 0 : code));
