import http from 'http';
import sirv, { RequestHandler } from 'sirv';
import type { IGraph } from "rush-dep-graph-web/src/graph/types";
import fs from 'fs';
import path from 'path';
import opener from 'opener';

function appendGraphData(html: string, graphData: IGraph): string  {
  const tag: string = '</div>';
  const offset: number = tag.length;
  const index: number = html.indexOf(tag) + offset;
  return html.slice(0, index) + `<script>window.graphData = ${JSON.stringify(graphData)};</script>` + html.slice(index);
}

async function startServer(graphData: IGraph): Promise<void> {
  const port: number = 9988;
  const host: string = '127.0.0.1';
  const templateHtmlPath: string = require.resolve('rush-dep-graph-web/dist/index.html');
  const assetsPath: string = path.dirname(templateHtmlPath);
  const sirvMiddleware: RequestHandler = sirv(assetsPath, {
    dev: true
  });
  const server: http.Server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      const html: string = appendGraphData(fs.readFileSync(templateHtmlPath, 'utf8'), graphData);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      sirvMiddleware(req, res);
    }
  })

  await new Promise(resolve => {
    server.listen(port, host, () => {
      resolve(true);
      const url: string = `http://${host}:${port}`;
      opener(url);
    })
  })
}

export { startServer };