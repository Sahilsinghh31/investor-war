'use strict';
// Zero-dependency local server: static files + /api/ai. Run: node dev-server.js  (reads .env)
const http = require('http'), fs = require('fs'), path = require('path');
try { for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch (e) {}
const api = require('./api/ai.js'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
http.createServer((req, res) => {
  if (req.url.startsWith('/api/ai')) {
    let b = ''; req.on('data', (d) => { b += d; if (b.length > 1e5) req.destroy(); });
    req.on('end', () => { req.body = b; res.status = (c) => { res.statusCode = c; return res; }; res.json = (o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); }; api(req, res); });
    return;
  }
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
  const f = path.join(__dirname, path.normalize(p));
  if (!f.startsWith(__dirname) || /^\/(lib|api)\//.test(p) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('content-type', T[path.extname(f)] || 'text/plain'); res.end(fs.readFileSync(f));
}).listen(process.env.PORT || 3000, () => console.log('INVESTOR WAR on http://localhost:' + (process.env.PORT || 3000)));
