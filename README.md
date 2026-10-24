# Man Ray

Game by Benjamin Leonard-Williams. All characters drawn by Ben & Seb
Leonard-Williams.

Underwater platform game for ages 5–10: Man Ray swims through five levels to
rescue his friend 4 Bunny from the God of the Zillas.

**Play:** double-click `index.html`.

| Key | Action |
| --- | --- |
| ← → | Swim |
| ↑ | Flap fins |
| Space | Fire laser |
| R | Fire a rocket (after buying the Rocket Launcher) |
| Space / Enter / click | Next tip, start |
| P or Esc | Pause |
| M | Mute |
| S | Skip intro tips (after finishing the level once) |
| T (title screen) | Turn the Instructor's tips on or off (remembered), or click the Tips switch |
| 1–5 (title screen) | Pick a level you've reached, or click its number |
| B (title screen) | Watch the story of how 4 Bunny was stolen (plays by itself before Level 1 the first time) |
| Space / S (story) | Next scene / skip the story |

**iPad and touch screens:** on-screen buttons appear automatically: ◀ ▶
swim, ⬆ flap, ⚡ zap, 🚀 rocket (once bought), ⏸ pause, 🔊 sound. On an
iPad they sit in a controller strip below the game; on a phone they sit
see-through over it. Tap the game to start, move through tips and pick
things in the shop. Prompts and the Instructor's tips switch between keys
and buttons to match whatever the player last used. In Safari, Share → Add to
Home Screen makes Man Ray open full-screen like an app, with Ben's drawing
as its icon.

**Game controllers** (Xbox, PlayStation and other standard controllers):
stick or d-pad to swim, A to flap (and OK on menus), X/B to zap, Y to fire
a rocket, Start to pause.

**Tests:** `node tests/run-tests.js`

**Swapping in your own drawings:** every character and object is drawn by one
function in `js/art.js` (for example `drawManRay`, `drawZillaFish`,
`drawInstructor`, `drawCarrot`). Replace a function's body with
`ctx.drawImage(...)` to use a picture instead.

**Levels:** 1 Coral Cove, 2 Kelp Forest, 3 Deep Trench (Octo-Pie waits at
the end), 4 Lava Lagoon (erupting volcanoes, then Tri-Terror), 5 Zilla's Lair (Man
Ray meets his friend Spiky, who helps him fight the God of the Zillas and set
4 Bunny free; beating him plays the ending and credits). Finishing a level
unlocks the next one on the title screen's level picker.

**Gerald's Shop:** after each level, the pearls Man Ray collected (golden
pearls count 5) go into his wallet to spend at Gerald's Shop. Upgrades stay
with him from then on: Rocket Launcher (10, press R for rockets that hit twice as hard), Mega
Punch (20, punches enemies that get close) and Sausage Cowboy Hat (30, a
sausage dog friend who chases off fish and crabs). ← → choose, Space buys.

**Adding a level:** copy `js/levels/level1.js`, change the data, add a
`<script>` tag for it in `index.html`, and add it to `MR.LevelOrder` in
`js/levels/common.js`. Each level picks a look from `js/themes.js`.
