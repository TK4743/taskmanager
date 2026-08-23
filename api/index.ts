import handler from '../server.js';

export default async function (req: any, res: any) {
  if (req.originalUrl) {
    req.url = req.originalUrl;
  }
  return handler(req, res);
}
