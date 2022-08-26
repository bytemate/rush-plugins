import escape from 'lodash.escape';
import { IGraph } from 'rush-dep-graph-web/src/graph/types';

/**
 * Escapes `<` characters in JSON to safely use it in `<script>` tag.
 */
function escapeJson(json: object): string {
  return JSON.stringify(json).replace(/</gu, '\\u003c');
}

function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.map((string, index) => `${string}${values[index] || ''}`).join('');
}

function getScript(filename: string): string {
  return `<script src="${escape(filename)}"></script>`;
}

interface IRenderViewer {
  title?: string,
  graphData: IGraph,
}


function renderViewer({title, graphData}: IRenderViewer): string {
  return html`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${escape(title ?? "Rush Dep Graph")}</title>
    ${getScript('viewer.js')}
  </head>

  <body>
    <div id="root"></div>
    <script>
      window.graphData = ${escapeJson(graphData)};
    </script>
  </body>
</html>`;
}

export { renderViewer }