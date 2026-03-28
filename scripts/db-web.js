/**
 * Browser UI for PostgreSQL (pgweb). Reads DATABASE_URL from backend/.env
 * Open http://127.0.0.1:8081 after it starts.
 */
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL in backend/.env');
  process.exit(1);
}

console.log('Starting pgweb → http://127.0.0.1:8081');
console.log('Stop with Ctrl+C\n');

spawn(
  'npx',
  ['--yes', 'pgweb', '--bind', '127.0.0.1', '--listen', '8081', '--url', url],
  { stdio: 'inherit', shell: true },
);
