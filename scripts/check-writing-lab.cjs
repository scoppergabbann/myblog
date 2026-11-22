const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'app/writing-lab/page.tsx'), 'utf8');
const lab = fs.readFileSync(path.join(root, 'app/writing-lab/writing-lab.tsx'), 'utf8');
const livePage = fs.readFileSync(path.join(root, 'app/writing/page.tsx'), 'utf8');

assert.match(page, /robots: \{ index: false, follow: false \}/, 'the design lab must stay out of search results');
assert.match(page, /<WritingLab writings=\{writings\}/, 'the preview must use real writing data');
assert.match(lab, /FeaturedWriting/, 'the preview should give the newest article a featured treatment');
assert.match(lab, /type="search"/, 'the preview should retain article search');
assert.match(lab, /aria-pressed=\{tag === activeTag\}/, 'topic filters must expose their selected state');
assert.match(lab, /hover:bg-\[var\(--color-paper-2\)\]/, 'cards should use color instead of hover shadows');
assert.doesNotMatch(lab, /shadow-/, 'the writing experiment must not introduce shadows');
assert.match(livePage, /<WritingFilter/, 'the current writing page must remain unchanged while the lab is reviewed');

console.log('PASS isolated Writing design lab, filters, and no-shadow treatment');
