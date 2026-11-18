import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MEDIA = 'https://media.napapp.io/posts';

/** Titles already used in the app. New kits fall back to a readable slug. */
const TITLES = {
  'real-reason-4-month-waking': 'A wake around four months',
  'wake-windows-7-12m': 'Wake windows, in plain words',
  'me-vs-baby-bedtime': 'The bedtime we planned',
  'real-reason-30-min-naps': 'When a nap is short',
  'partner-handoff-log': 'Handing the night over',
  'real-reason-5am-wakes': 'A wake around five',
  'earlier-bedtime-question': 'An earlier bedtime',
  'contact-naps-to-crib': 'From arms to the crib',
  'me-vs-baby-halloween': 'A Halloween bedtime',
  '2-to-1-nap-transition': 'From two naps to one',
  'clocks-went-back-5am': 'After the clocks change',
  'false-starts-after-bedtime': 'False starts after bedtime',
  '3-to-2-nap-transition': 'From three naps to two',
  'me-vs-baby-teething-night': 'A teething night',
  'total-sleep-by-age': 'How much sleep, by age',
  'bedtime-routine-steps': 'A bedtime routine',
  'real-reason-bedtime-battles': 'When bedtime is a battle',
  'sleepy-cues-pov': 'Sleepy cues',
  'newborn-evening-shift': 'The newborn evening',
  'newborn-sleep-log-receipt': 'A newborn sleep log',
};

function clipId(folder) {
  return folder.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function humanize(id) {
  const words = id.replace(/-/g, ' ').replace(/\bpov\b/g, '').replace(/\s+/g, ' ').trim();
  if (!words) return id;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function dateKey(folder) {
  return folder.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
}

const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8' })
  .split('\n')
  .filter((path) => /^posts\/[^/]+\/reel_kit\/reel\.mp4$/.test(path));

if (paths.length === 0) {
  console.error('No reel kits found. Leaving the catalog unchanged.');
  process.exit(1);
}

const seen = new Set();
const clips = paths.map((path) => {
  const folder = path.split('/')[1];
  let id = clipId(folder);
  if (seen.has(id)) id = folder;
  seen.add(id);
  return {
    id,
    title: TITLES[id] ?? humanize(id),
    url: `${MEDIA}/${folder}/reel_kit/reel.mp4`,
    folder,
  };
});

clips.sort((a, b) => {
  const dateA = dateKey(a.folder);
  const dateB = dateKey(b.folder);
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  return a.folder.localeCompare(b.folder);
});

const out = join(process.cwd(), 'library', 'reels.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  `${JSON.stringify({ clips: clips.map(({ id, title, url }) => ({ id, title, url })) }, null, 2)}\n`,
);
console.log(`Wrote ${clips.length} clips to library/reels.json`);
