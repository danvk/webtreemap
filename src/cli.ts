/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Command} from 'commander';
import {promises as fs} from 'fs';
import crypto from 'crypto';
import open from 'open';
import os from 'os';
import path from 'path';
import readline from 'readline';

import * as tree from './tree';

/** Reads stdin into an array of lines. */
async function readLines() {
  return new Promise<string[]>((resolve, reject) => {
    const rl = readline.createInterface({input: process.stdin});
    const lines: string[] = [];
    rl.on('line', line => {
      lines.push(line);
    });
    rl.on('close', () => {
      resolve(lines);
    });
  });
}

/** Read an array of lines from a list of files */
async function readLinesFromFiles(files: string[]) {
  let lines: string[] = [];
  for (const file of files) {
    const contents = await fs.readFile(file, 'utf-8');
    lines = lines.concat(contents.split('\n'));
  }
  return lines;
}

function parseLine(line: string): [string, number] {
  if (line.match(/^\s*$/)) {
    // Skip blank / whitespace-only lines
    return ['', 0];
  }

  // Match (number)(whitespace)(path)
  let m = line.match(/(\S+)\s+(.*)/);
  if (m) {
    const [, sizeStr, path] = m;
    const size = Number(sizeStr);
    if (isNaN(size)) {
      throw new Error(`Unable to parse ${size} as a number in line: "${line}"`);
    }
    return [path, size];
  }

  // Assume it's (path)
  return [line, 1];
}

/** Constructs a tree from an array of lines. */
function treeFromLines(lines: string[]): tree.Node {
  let node = tree.treeify(lines.map(parseLine));

  // If there's a common empty parent, skip it.
  if (node.id === undefined && node.children && node.children.length === 1) {
    node = node.children[0];
  }

  // If there's an empty parent, roll up for it.
  if (node.size === 0 && node.children) {
    for (const c of node.children) {
      node.size += c.size;
    }
  }

  tree.rollup(node);
  tree.sort(node);
  tree.flatten(node);

  return node;
}

// TODO: update to use either SI units or Kibibytes
function humanSizeCaption(n: tree.Node): string {
  let units = ['', 'k', 'm', 'g'];
  let unit = 0;
  let size = n.size;
  while (size > 1024 && unit < units.length - 1) {
    size = size / 1024;
    unit++;
  }
  return `${n.id || ''} (${size.toFixed(1)}${units[unit]})`;
}


/** Write contents (utf-8 encoded) to a temp file, returning the path to the file. */
async function writeToTempFile(contents: string): Promise<string> {
  const randHex = crypto.randomBytes(4).readUInt32LE(0).toString(16);
  const filename = path.join(os.tmpdir(), `webtreemap-${randHex}.html`);
  await fs.writeFile(filename, contents, {encoding: 'utf-8'});
  return filename;
}

async function main() {
  const args = new Command()
                   .description(`Generate web-based treemaps.

  Reads a series of
    size path
  lines from stdin, splits path on '/' and outputs HTML for a treemap.
`)
                   .option('-o, --output [path]', 'output to file, not stdout')
                   .option('--title [string]', 'title of output HTML')
                   .parse(process.argv);

  const lines =
    args.args.length > 0 ? readLinesFromFiles(args.args) : readLines();

  const node = treeFromLines(await lines);

  const treemapJS = await fs.readFile(__dirname + '/../dist/webtreemap.js', 'utf-8');
  const treemapCSS = await fs.readFile(__dirname + '/../src/styles-to-add.css', 'utf-8');
  const title = args.title || 'webtreemap';

  let inlineScript = `
  const data = ${JSON.stringify(node)};
  const container = document.getElementById("treemap");
  const treemap = new webtreemap.TreeMap(data, {
    caption: ${humanSizeCaption},
  });
  treemap.render(container);
  const resizeObserver = new ResizeObserver(() => treemap.layout(data, container));
  resizeObserver.observe(container);
  `;
  let output = `<!doctype html>
<title>${title}</title>
<style>
body {
  font-family: sans-serif;
}
#treemap {
  width: 95vw;
  max-width: 1300px;
  height: 80vh;
}
${treemapCSS}
</style>
<div id='treemap'></div>
<script>${treemapJS}</script>
<script>
  ${inlineScript}
</script>
`;
  if (args.output) {
    await fs.writeFile(args.output, output, {encoding: 'utf-8'});
  } else if (!process.stdout.isTTY) {
    console.log(output);
  } else {
    open(await writeToTempFile(output));
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
