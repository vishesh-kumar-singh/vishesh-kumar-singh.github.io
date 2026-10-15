const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Preparing Environment for Vite Production Build ---');

let raw = process.env.ENV_FILE || '';

// If ENV_FILE wasn't in process.env, check if a local .env already exists
if (!raw && fs.existsSync('.env')) {
  raw = fs.readFileSync('.env', 'utf8');
}

if (raw.includes('\\n') && !raw.includes('\n')) {
  raw = raw.replace(/\\n/g, '\n');
}

const lines = raw.split('\n');
const map = new Map();

for (let line of lines) {
  line = line.trim().replace(/^[0-9]+:\s*/, '').trim();
  if (line && line.includes('=') && !line.startsWith('#')) {
    const eqIdx = line.indexOf('=');
    const k = line.slice(0, eqIdx).trim();
    const v = line.slice(eqIdx + 1).trim();
    if (k.startsWith('VITE_') && v) {
      map.set(k, v);
    }
  }
}

// Automatically convert plaintext admin password to irreversible SHA-256 hash
// so the plaintext password is NEVER exposed in the frontend JavaScript bundle!
if (map.has('VITE_ADMIN_PASSWORD')) {
  const plain = map.get('VITE_ADMIN_PASSWORD');
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  map.set('VITE_ADMIN_PASSWORD_HASH', hash);
  map.delete('VITE_ADMIN_PASSWORD');
  delete process.env.VITE_ADMIN_PASSWORD;
  process.env.VITE_ADMIN_PASSWORD_HASH = hash;
}

// Clean up any empty process.env variables that were passed as dummy empty secrets
const known = [
  'VITE_WEB3FORMS_ACCESS_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_ADMIN_PASSWORD_HASH'
];

for (const k of known) {
  if (map.has(k) && map.get(k)) {
    // Explicitly set in process.env so it overrides any empty parent variables
    process.env[k] = map.get(k);
  } else if (!process.env[k] || process.env[k].trim() === '') {
    // Remove empty dummy variable so it doesn't mask anything
    delete process.env[k];
  }
}

// Write .env and .env.production
let envContent = '';
for (const [k, v] of map.entries()) {
  envContent += `${k}=${v}\n`;
}
fs.writeFileSync('.env', envContent);
fs.writeFileSync('.env.production', envContent);

const loadedKeys = Array.from(map.keys());
console.log('✅ Injected and verified keys:', loadedKeys.join(', '));

// Automatically sync blogs/Images to public/blogs/Images so markdown images work seamlessly
if (fs.existsSync('blogs/Images')) {
  fs.mkdirSync('public/blogs/Images', { recursive: true });
  fs.cpSync('blogs/Images', 'public/blogs/Images', { recursive: true });
  console.log('🖼️  Synced blog images to public/blogs/Images');
}

// Run Vite build with the sanitized, populated environment
console.log('--- Running Vite Build ---');
execSync('npx vite build', { stdio: 'inherit', env: process.env });

// Self-check: verify that the generated JS bundle actually has Web3Forms and Firebase
const files = fs.readdirSync('dist/assets');
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
if (jsFile) {
  const content = fs.readFileSync('dist/assets/' + jsFile, 'utf8');
  const hasWeb3 = map.has('VITE_WEB3FORMS_ACCESS_KEY') ? content.includes(map.get('VITE_WEB3FORMS_ACCESS_KEY')) : false;
  const hasFirebase = map.has('VITE_FIREBASE_API_KEY') ? content.includes(map.get('VITE_FIREBASE_API_KEY')) : false;
  console.log(`--- Verification: Bundle check [${jsFile}] ---`);
  console.log('Web3Forms Access Key baked into JS:', hasWeb3 ? '✅ YES' : '❌ NO');
  console.log('Firebase API Key baked into JS:', hasFirebase ? '✅ YES' : '❌ NO');
  if (map.has('VITE_WEB3FORMS_ACCESS_KEY') && !hasWeb3) {
    console.error('CRITICAL: Web3Forms access key was not bundled into JavaScript!');
    process.exit(1);
  }
}
