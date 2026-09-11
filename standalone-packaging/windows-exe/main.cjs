const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const { spawn } = require('child_process');

// Load custom app-config (Default: Local server http://localhost:3000/api - ZERO Vercel)
let config = {
  backendApiUrl: 'http://localhost:3000/api'
};

const configPath = path.join(__dirname, 'app-config.json');
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn('Could not parse app-config.json, using localhost:3000 fallback.', err);
  }
}

let backendProcess = null;

// Optionally attempt to spawn local backend if running inside repository and server is down
function maybeStartLocalBackend() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const serverTsPath = path.join(rootDir, 'server.ts');

  // Check if root project server.ts exists
  if (fs.existsSync(serverTsPath) && config.backendApiUrl.includes('localhost:3000')) {
    // Check if port 3000 is already active
    const req = http.get('http://localhost:3000/api/health', (res) => {
      console.log('[Backend] Local server is already running on port 3000.');
    });

    req.on('error', () => {
      console.log('[Backend] Port 3000 not responding. Starting background local backend server via tsx...');
      try {
        backendProcess = spawn('npx', ['tsx', 'server.ts'], {
          cwd: rootDir,
          shell: true,
          stdio: 'ignore',
          detached: false
        });
        console.log('[Backend] Background local backend process initiated.');
      } catch (e) {
        console.warn('[Backend] Could not auto-start local backend process:', e.message);
      }
    });
  }
}

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

let localServer = null;
let serverPort = 0;
let mainWindow = null;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    const webDir = path.join(__dirname, 'web');

    localServer = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // 1. API Reverse Proxy to Local or Custom Server (No Vercel required!)
      if (pathname.startsWith('/api/') || pathname === '/api') {
        const targetBase = (config.backendApiUrl || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
        const targetUrlString = targetBase + req.url;
        const targetUrl = new URL(targetUrlString);
        const isHttps = targetUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const proxyHeaders = { ...req.headers };
        proxyHeaders.host = targetUrl.host;
        delete proxyHeaders['origin'];

        const proxyReq = client.request(
          targetUrl,
          {
            method: req.method,
            headers: proxyHeaders,
            rejectUnauthorized: false
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err) => {
          console.error('[Proxy Error] Backend unreachable:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Backend server is not running or unreachable',
            details: `Target: ${targetBase}. Please run run.bat to start the local backend server, or update app-config.json with your server IP.`
          }));
        });

        req.pipe(proxyReq);
        return;
      }

      // 2. Static File Serving
      let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
      }

      let filePath = path.join(webDir, safePath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // SPA Fallback for client routes
          filePath = path.join(webDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
          }
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
          });
          res.end(content);
        });
      });
    });

    localServer.listen(0, '127.0.0.1', () => {
      serverPort = localServer.address().port;
      console.log(`[Electron Desktop] Local embedded server running on http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });

    localServer.on('error', reject);
  });
}

function createMainWindow() {
  const iconPath = path.join(__dirname, 'web', 'logo.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 650,
    title: 'VSBEC IT Task Manager (Desktop)',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}/`);

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      if (!targetUrl.includes(`127.0.0.1:${serverPort}`)) {
        shell.openExternal(targetUrl);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    maybeStartLocalBackend();
    await startLocalServer();
    createMainWindow();

    ipcMain.on('open-external', (_, link) => {
      if (link && (link.startsWith('http:') || link.startsWith('https:'))) {
        shell.openExternal(link);
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  } catch (err) {
    console.error('Failed to initialize desktop application:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (localServer) {
    localServer.close();
  }
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
