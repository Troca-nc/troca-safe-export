const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 8081);

process.on('uncaughtException', (error) => {
  console.error(error);
});
process.on('unhandledRejection', (error) => {
  console.error(error);
});

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.join(distDir, normalized === '/' ? 'index.html' : normalized);
  if (!resolved.startsWith(distDir)) {
    return path.join(distDir, 'index.html');
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url || '/');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end('Server error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Troca mobile web ready at http://localhost:${port}`);
});

setInterval(() => {}, 60_000);
