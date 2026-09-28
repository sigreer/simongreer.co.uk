// scripts/gen-route-manifest.mjs
// Reads the OLD content tree (Astro 5 layout) and emits docs/specs/route-manifest.json.
// Run once from the repo root while src/content still holds the legacy frontmatter.
// MANIFEST_OUT overrides the output path; REVERSE_ORDER=1 enumerates files backwards (self-check).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outFile = process.env.MANIFEST_OUT || 'docs/specs/route-manifest.json';
const collections = [
  { name: 'blog', dir: 'src/content/blog', prefix: '/blog/' },
  { name: 'tech', dir: 'src/content/tech', prefix: '/tech/' },
  { name: 'projects', dir: 'src/content/projects', prefix: '/tech/projects/' },
];

function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${file}`);
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return out;
}

// Pass 1: collect entries with their legacy path and desired new id.
const entries = [];
for (const c of collections) {
  const files = readdirSync(join(root, c.dir)).filter((n) => /\.mdx?$/.test(n));
  if (process.env.REVERSE_ORDER) files.reverse(); // used by the self-check to prove order independence
  for (const f of files) {
    const file = join(c.dir, f);
    const fm = frontmatter(join(root, file));
    const filename = f.replace(/\.mdx?$/, '');
    const slug = fm.slug || filename; // Astro 5 glob loader used slug as id when present
    entries.push({
      c,
      file,
      filename,
      slug,
      status: fm.status || 'published',
      title: fm.title || '',
      currentPath: `${c.prefix}${slug}/`,
    });
  }
}

const rows = [];
const live = entries.filter((e) => {
  if (e.status !== 'published') {
    rows.push(row(e, null, 'drop', `status ${e.status}`));
    return false;
  }
  if (e.title === 'Project Title') {
    rows.push(row(e, null, 'drop', 'placeholder entry'));
    return false;
  }
  return true;
});

// Pass 2: desired new id per entry, then resolve collisions deterministically.
for (const e of live) {
  e.newId = e.slug.endsWith('.mdx') ? e.slug.replace(/\.mdx$/, '') : e.slug;
}
const byTarget = new Map();
for (const e of live) {
  const key = `${e.c.prefix}${e.newId}/`;
  byTarget.set(key, [...(byTarget.get(key) || []), e]);
}
for (const [target, group] of byTarget) {
  if (group.length === 1) continue;
  // Rule: the entry whose filename equals the contested id owns it; every other entry falls back to its filename.
  const owners = group.filter((e) => e.filename === e.newId);
  if (owners.length !== 1)
    throw new Error(`unresolvable collision for ${target}: ${group.map((g) => g.file).join(', ')}`);
  for (const e of group)
    if (e !== owners[0]) {
      e.newId = e.filename;
      e.collidedWith = owners[0].file;
    }
}

for (const e of live) {
  const newPath = `${e.c.prefix}${e.newId}/`;
  if (e.collidedWith)
    rows.push(
      row(
        e,
        newPath,
        'keep',
        `slug collided with ${e.collidedWith}; uses filename ${e.filename} (new path, no redirect)`,
      ),
    );
  else if (e.slug.endsWith('.mdx')) rows.push(row(e, newPath, 'redirect', 'slug contained .mdx'));
  else if (e.slug !== e.filename)
    rows.push(row(e, newPath, 'keep', `rename file ${e.filename}.mdx -> ${e.slug}.mdx`));
  else rows.push(row(e, newPath, 'keep', 'unchanged'));
}

function row(e, newPath, action, reason) {
  return { collection: e.c.name, file: e.file, currentPath: e.currentPath, newPath, action, reason };
}

// Static aliases and service pages
rows.push({
  collection: 'static',
  file: null,
  currentPath: '/me/',
  newPath: '/me/personally/',
  action: 'redirect',
  reason: 'existing rule',
});
rows.push({
  collection: 'static',
  file: null,
  currentPath: '/me/get-in-touch/',
  newPath: '/get-in-touch/',
  action: 'redirect',
  reason: 'replaces meta-refresh page',
});
rows.push({
  collection: 'static',
  file: null,
  currentPath: '/home/',
  newPath: null,
  action: 'drop',
  reason: 'orphan duplicate of /',
});
for (const [oldPage, target] of [
  ['vpn-setup-routing-wireguard-ipsec-openvpn', 'networking-and-security'],
  ['system-administration', 'system-design-and-deployment'],
])
  rows.push({
    collection: 'services',
    file: null,
    currentPath: `/hire-me/${oldPage}/`,
    newPath: `/hire-me/${target}/`,
    action: 'redirect',
    reason: 'page merged (spec §4.3)',
  });
for (const p of [
  'web-development',
  'business-apps',
  'cloud-and-hosted',
  'networking-and-security',
  'storage-and-nas',
  'software-development',
  'data-and-databases',
  'system-design-and-deployment',
])
  rows.push({
    collection: 'services',
    file: null,
    currentPath: `/hire-me/${p}/`,
    newPath: `/hire-me/${p}/`,
    action: 'keep',
    reason: 'service page',
  });
rows.push({
  collection: 'services',
  file: null,
  currentPath: null,
  newPath: '/hire-me/ai-and-automation/',
  action: 'keep',
  reason: 'new service page (spec §4.3)',
});

// Self-checks
const kept = rows.filter((r) => r.action === 'keep').map((r) => r.newPath);
if (new Set(kept).size !== kept.length) throw new Error('duplicate kept destination paths');
const find = (file) => rows.find((r) => r.file === file);
if (find('src/content/tech/langchain.mdx')?.newPath !== '/tech/langchain/')
  throw new Error('langchain must own /tech/langchain/');
if (find('src/content/tech/flowise.mdx')?.newPath !== '/tech/flowise/')
  throw new Error('flowise must move to /tech/flowise/');

rows.sort((a, b) =>
  `${a.collection}${a.currentPath}${a.file}`.localeCompare(`${b.collection}${b.currentPath}${b.file}`),
);
writeFileSync(outFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);
const counts = {};
for (const r of rows) {
  counts[r.action] = (counts[r.action] || 0) + 1;
}
console.log(JSON.stringify(counts));
