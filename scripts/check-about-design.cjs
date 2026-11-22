const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(path.join(__dirname, '..', 'app/about/page.tsx'), 'utf8');

assert.match(page, /getAboutData\(\)/, 'About content must remain editable from admin data');
assert.match(page, /compileMdx\(about\.content/, 'the existing personal story must be preserved');
assert.match(page, /extractToc\(about\.content\)/, 'the editorial sidebar should follow MDX chapters');
assert.match(page, /BBS \/ personal profile/, 'About should have an editorial hero');
assert.match(page, /Stack yang saya pakai\./, 'the tools section should retain its content');
assert.match(page, /mailto:\$\{about\.contactEmail\}/, 'the contact call to action must remain functional');
assert.doesNotMatch(page, /shadow-/, 'About must not introduce hover shadows');

console.log('PASS editorial About layout, dynamic content, chapter navigation, stack, and contact');
