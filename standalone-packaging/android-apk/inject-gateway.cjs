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

const gatewayScript = `
  <!-- Production Mobile Backend Gateway (taskmanagervsbec.vercel.app) -->
  <script>
    (function() {
      var defaultUrl = ${JSON.stringify(defaultBackendUrl)};
      var getSavedBackend = function() {
        var saved = localStorage.getItem('it_taskmanager_backend_url');
        if (!saved || saved.indexOf('it-taskmanager.vercel.app') !== -1 || saved.indexOf('192.168.') !== -1 || saved.indexOf('10.0.2.2') !== -1) {
          localStorage.setItem('it_taskmanager_backend_url', defaultUrl);
          return defaultUrl;
        }
        return saved;
      };

      var origFetch = window.fetch;
      window.fetch = function(url, opts) {
        var backend = getSavedBackend().replace(/\\/api\\/?$/, '');
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

        return origFetch.call(this, targetUrl, opts).catch(function(err) {
          console.error('[Mobile Gateway Error] Cannot reach server at: ' + targetUrl, err);
          if (!window.__server_err_alerted) {
            window.__server_err_alerted = true;
            setTimeout(function() {
              alert('⚠️ Server Connection Failed!\\n\\nCannot reach server at:\\n' + backend + '\\n\\nPlease check your mobile internet connection or Wi-Fi.\\n\\nTap the ⚙️ Server button at bottom-left to configure if needed.');
              window.__server_err_alerted = false;
            }, 300);
          }
          throw err;
        });
      };

      // Floating button to configure or change server IP anytime on mobile
      window.addEventListener('DOMContentLoaded', function() {
        var currentBackend = getSavedBackend();
        var btn = document.createElement('button');
        btn.id = 'mobile-server-config-btn';
        btn.innerHTML = '⚙️ ' + currentBackend.replace(/^https?:\\/\\//, '');
        btn.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:999999;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);color:#38bdf8;font-size:10px;font-family:sans-serif;font-weight:700;border:1px solid rgba(56,189,248,0.4);padding:6px 10px;border-radius:20px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.4);';

        btn.onclick = function() {
          var current = getSavedBackend();
          var input = prompt(
            'VSBEC IT Task Manager - Server Configuration\\n\\n' +
            'Live Production Backend:\\n' +
            '• https://taskmanagervsbec.vercel.app\\n\\n' +
            'Current Server:',
            current
          );
          if (input !== null && input.trim() !== '') {
            var formatted = input.trim().replace(/\\/api\\/?$/, '');
            localStorage.setItem('it_taskmanager_backend_url', formatted);
            alert('Connected server set to:\\n' + formatted + '\\n\\nReloading application...');
            window.location.reload();
          }
        };
        document.body.appendChild(btn);
      });
    })();
  </script>
`;

html = html.replace('<head>', '<head>' + gatewayScript);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Mobile API gateway successfully configured with https://taskmanagervsbec.vercel.app');
