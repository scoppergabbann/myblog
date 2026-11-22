const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'app/writing-lab/page.tsx'), 'utf8');
const index = fs.readFileSync(path.join(root, 'components/writing-index.tsx'), 'utf8');
const livePage = fs.readFileSync(path.join(root, 'app/writing/page.tsx'), 'utf8');
const tagPage = fs.readFileSync(path.join(root, 'app/writing/tag/[tag]/page.tsx'), 'utf8');

assert.match(page, /robots: \{ index: false, follow: false \}/, 'the design lab must stay out of search results');
assert.match(page, /<WritingIndex/, 'the lab should share the production design');
assert.match(index, /FeaturedWriting/, 'the newest article should receive a featured treatment');
assert.match(index, /type="search"/, 'the index should retain article search');
assert.match(index, /aria-pressed=\{tag === activeTag\}/, 'topic filters must expose their selected state');
assert.match(index, /categoryPageSize = 6/, 'filtered categories should show six articles per page');
assert.match(index, /hover:bg-\[var\(--color-paper-2\)\]/, 'cards should use color instead of hover shadows');
assert.doesNotMatch(index, /shadow-/, 'the writing index must not introduce shadows');
assert.match(livePage, /const PAGE_SIZE = 8/, 'the main writing archive should show eight articles per page');
assert.match(livePage, /<WritingIndex/, 'the approved editorial design should be live on Writing');
assert.match(livePage, /tag\.trim\(\)\.toLowerCase\(\) === 'saham'/, 'stock posts should stay outside the main archive count');
assert.match(index, /String\(totalItems\)/, 'the hero count should use the non-stock archive total');
assert.match(tagPage, /const PAGE_SIZE = 6/, 'dedicated category pages should show six articles per page');
assert.match(tagPage, /dynamic = 'force-dynamic'/, 'category pagination must render dynamically in production');

console.log('PASS production Writing design, restored topics, and pagination limits');
