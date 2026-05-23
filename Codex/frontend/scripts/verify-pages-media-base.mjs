import fs from 'node:fs';
import path from 'node:path';

const distHtml = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(distHtml)) {
  console.error(`Missing build output: ${distHtml}`);
  process.exit(1);
}

const html = fs.readFileSync(distHtml, 'utf8');
if (html.length < 500_000) {
  console.error(`dist/index.html looks too small (${html.length} bytes). Build may have failed silently.`);
  process.exit(1);
}

// Loose checks — minified bundles may split strings; any of these is enough.
const pagesCdnHints = [
  '585swinemerchant.github.io/legendary-horizon-demo',
  '/legendary-horizon-demo/assets/',
];
const introHints = ['intro-media-v1', 'intro_davinci.web.mp4', 'releases/download'];

const hasPagesCdn = pagesCdnHints.some((s) => html.includes(s));
const hasIntroRelease = introHints.every((s) => html.includes(s));

if (!hasPagesCdn) {
  console.error('Build verification failed: expected GitHub Pages CDN asset URLs in bundle.');
  console.error('Tried:', pagesCdnHints);
  process.exit(1);
}

if (!hasIntroRelease) {
  console.error('Build verification failed: expected intro release video hints in bundle.');
  console.error('Tried:', introHints);
  process.exit(1);
}

console.log('GitHub Pages build verification passed.');
