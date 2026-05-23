import fs from 'node:fs';

const html = fs.readFileSync('dist/index.html', 'utf8');
const pagesCdn = 'https://585swinemerchant.github.io/legendary-horizon-demo/';
const introReleaseTag = 'releases/download/intro-media-v1/';
const introWebMp4 = 'intro_davinci.web.mp4';

const checks = [
  { label: 'Pages CDN (maps/audio/sprites)', ok: html.includes(pagesCdn) },
  {
    label: 'Intro video on GitHub Release',
    ok: html.includes(introReleaseTag) && html.includes(introWebMp4),
  },
  {
    label: 'Intro scene art on Pages',
    ok: html.includes('/legendary-horizon-demo/assets/intro/scene_4_dagger_sword_1775784333493.png'),
  },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error('GitHub Pages build verification failed:');
  for (const f of failed) console.error(`  - ${f.label}`);
  process.exit(1);
}
console.log('GitHub Pages build verification passed.');
