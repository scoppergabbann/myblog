const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
const bird = fs.readFileSync(path.join(root, 'components/home-update-bird.tsx'), 'utf8');
const updates = fs.readFileSync(path.join(root, 'lib/home-updates.ts'), 'utf8');
const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');

assert.match(home, /<HomeUpdateBird updates=\{contentUpdates\}/, 'homepage must render the update bird');
assert.match(home, /getAllWritings/, 'writing updates must be loaded');
assert.match(home, /getPublishedMonologEpisodes/, 'Monolog updates must be loaded');
assert.match(home, /getLibraryData/, 'Library updates must be loaded');
assert.match(home, /getStreamEntries/, 'Now updates must be loaded');
assert.match(updates, /kind: 'writing'/);
assert.match(updates, /kind: 'monolog'/);
assert.match(updates, /kind: 'library'/);
assert.match(updates, /kind: 'now'/);
assert.match(bird, /localStorage\.setItem\(STORAGE_KEY/, 'opened updates should be remembered per browser');
assert.match(bird, /aria-expanded=\{open\}/, 'the wooden perch must expose its panel state');
assert.match(css, /@keyframes homeBirdRoam/, 'the bird should roam around the homepage');
assert.match(css, /@keyframes homeBirdDirection/, 'the bird should face its direction of travel');
assert.match(css, /53%, 89\.99% \{ transform: scaleX\(1\)/, 'desktop direction must flip at the return-path turning point');
assert.match(css, /@keyframes homeBirdDirectionMobile/, 'mobile must use its own synchronized turning point');
assert.match(css, /animation-duration: 480ms, 23s/, 'mobile wing flaps must stay fast while the route uses its longer cycle');
assert.match(css, /@keyframes homeBirdWingFront/, 'the flight pose should use a full wing flap');
assert.match(bird, /home-bird-wing-back/, 'the bird should have a layered flight silhouette');
assert.match(bird, /home-bird-legs/, 'the bird should tuck its legs during flight');
assert.match(bird, /home-bird-box-perch/, 'the bird should land on the opened notification box');
assert.match(css, /@keyframes homeBirdLandOnBox/, 'opening the box should include a landing transition');
assert.match(css, /home-bird-notifier\.is-open \.home-bird-route-sprite \{ opacity: 0/, 'the roaming copy should leave its branch while the box is open');
assert.match(css, /prefers-reduced-motion: reduce[\s\S]*home-bird-sprite/, 'motion preference must stop bird animation');
assert.doesNotMatch(bird, /shadow-/, 'the notifier must not introduce shadows');

console.log('PASS flying homepage bird, wooden notifier, four content sources, unread memory, and reduced motion');
