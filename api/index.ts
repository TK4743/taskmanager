import handler from '../server.js';

export default async function (req: any, res: any) {
  // Normalize req.url if modified by Vercel serverless rewrites
  if (req.originalUrl && (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') && !req.url.startsWith('/api') && req.url !== '/health') {
    req.url = req.originalUrl;
  }
  return handler(req, res);
}
