const fs = require('fs');
const path = require('path');

const wwwDir = path.join(__dirname, 'www');
const distDir = path.join(__dirname, '..', '..', 'dist');
const indexPath = path.join(wwwDir, 'index.html');
const distIndexPath = path.join(distDir, 'index.html');
const envPath = path.join(__dirname, 'env.json');

// 1. Sync compiled frontend from dist to www if dist exists
if (fs.existsSync(distDir)) {
  if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
  }
  fs.cpSync(distDir, wwwDir, { recursive: true });
  console.log('[*] Synced latest dist/ assets to android-apk/www/');
}

let defaultBackendUrl = 'https://taskmanagervsbec.vercel.app';
if (fs.existsSync(envPath)) {
  try {
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf8'));
    if (envData.BACKEND_SERVER_URL) {
      defaultBackendUrl = envData.BACKEND_SERVER_URL.trim();
    }
  } catch (e) {
    console.warn('[!] Failed to parse env.json, using fallback backend URL');
  }
}

let html = fs.readFileSync(distIndexPath, 'utf8');

// Ensure viewport-fit=cover is included for notch/display cutout support
if (html.includes('name="viewport"')) {
  html = html.replace(/name="viewport"\s+content="([^"]*)"/, (match, content) => {
    if (!content.includes('viewport-fit=cover')) {
      return `name="viewport" content="${content}, viewport-fit=cover"`;
    }
    return match;
  });
}

const gatewayScript = `
  <!-- Production Mobile Backend Gateway (taskmanagervsbec.vercel.app) & Notch Support -->
  <style>
    :root {
      --safe-area-top: env(safe-area-inset-top, 0px);
    }
    body {
      padding-top: env(safe-area-inset-top, 0px);
      background-color: #0f172a;
    }
  </style>
  <script>
    (function() {
      var backend = ${JSON.stringify(defaultBackendUrl)}.replace(/\\/api\\/?$/, '');

      // Ensure localStorage always uses taskmanagervsbec.vercel.app
      try {
        localStorage.setItem('it_taskmanager_backend_url', backend);
      } catch (e) {}

      var origFetch = window.fetch;
      window.fetch = function(url, opts) {
        var targetUrl = url;

        if (typeof url === 'string') {
          if (url.startsWith('/api/')) {
            targetUrl = backend + url;
          } else if (url.indexOf('/api/') !== -1 && (url.indexOf('localhost') !== -1 || url.indexOf('10.0.2.2') !== -1 || url.indexOf('192.168.') !== -1 || url.indexOf('it-taskmanager.vercel.app') !== -1)) {
            targetUrl = backend + url.substring(url.indexOf('/api/'));
          }
        } else if (url && url.url) {
          var u = url.url;
          if (u.startsWith('/api/')) {
            targetUrl = new Request(backend + u, opts || url);
          } else if (u.indexOf('/api/') !== -1 && (u.indexOf('localhost') !== -1 || u.indexOf('10.0.2.2') !== -1 || u.indexOf('192.168.') !== -1 || u.indexOf('it-taskmanager.vercel.app') !== -1)) {
            targetUrl = new Request(backend + u.substring(u.indexOf('/api/')), opts || url);
          }
        }

        return origFetch.call(this, targetUrl, opts);
      };
    })();
  </script>
`;

html = html.replace('<head>', '<head>' + gatewayScript);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Mobile API gateway successfully configured (clean native UI with notch support)');
