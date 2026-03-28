/**
 * Free ports used by this project (API + Vite dev). Uses kill-port via npx (no extra install).
 */
const { execSync } = require('child_process');

const ports = ['5000', '5173'];
try {
  execSync(`npx --yes kill-port ${ports.join(' ')}`, {
    stdio: 'inherit',
    shell: true,
  });
  console.log('Stopped processes on ports', ports.join(', '), '(if any were listening).');
} catch {
  console.log('kill-port finished (some ports may have been idle).');
}
