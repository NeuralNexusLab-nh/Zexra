# Zexra

A self-contained, static WebGL arena shooter by NXLabTW. Fast movement, fictional modern firearms, local AI opponents and an industrial arena with daytime and night configurations. The entire interface is in English, with a purple and ice-blue visual identity.

## Play locally

Requires Node.js 20+ for the optional local preview server. There are no npm dependencies to install.

```sh
npm start
```

Open **http://localhost:65535**. Click **ENTER ARENA** to capture the mouse and enable audio. If the browser denies pointer lock, a drag-to-look fallback remains available. The game canvas hides the cursor during play; menus restore it. Press Escape to pause and release the mouse. Leave the preview terminal running while playing.

## Static deployment

Serve the repository root using any static HTTPS host. For GitHub Pages, choose **Settings → Pages → Deploy from a branch → main → /(root)**. All paths are relative, so project subpaths work. No build, server functions, database, API keys, login or external asset CDN is needed. `tools/serve.mjs` is a development convenience, not a production backend.

## Modes

- **Skirmish:** free-for-all against 3 AI opponents on easy or 5 on standard/elite. First to 25 eliminations, or the highest score after five minutes, wins. Bots also fight each other. Respawn protection ends when firing.
- **Duel:** one AI opponent, first to five rounds. Each round lasts 90 seconds; timeouts repeat the tied round.
- **Range:** six moving practice targets, unlimited reserve ammunition and grenade replenishment. Targets respawn and do not attack.

DRYDOCK and NIGHTSHIFT share an industrial site with different lighting and cover arrangements. The central service deck is accessible using stairs. Containers, supply crates and barriers provide cover and jump routes. Navigation and bullet visibility use the same collision boxes as movement.

## Controls

| Action | Keyboard / mouse |
| --- | --- |
| Move / look | WASD / mouse |
| Fire / aim | Left / right mouse |
| Sprint | Shift |
| Crouch / slide while sprinting | Ctrl or C |
| Jump | Space |
| Reload | R |
| Primary / pistol / knife | 1 / 2 / 3 or mouse wheel |
| Grenade | G |
| Inspect | F |
| Pause | Escape |
| Full screen | Alt + Enter |

Touch devices get a movement stick, right-side camera drag and action buttons. Full joystick deflection sprints. Touch aim toggles. Landscape is recommended; portrait menus and controls are also laid out independently. Hardware acceleration and WebGL 2 are required. Desktop keyboard and touch inputs are implemented; gamepad input is not implemented.

## Presentation and performance

- Six procedural firearm models: AK-47, VCR2, MP5, AWP, M1 Garand and P-19; tactical knife and grenades. VCR2 is fictional; the other names identify game interpretations rather than manufacturer-approved simulations.
- ADS, recoil, stance-dependent dispersion, range falloff, headshots, moving magazines/bolts, muzzle flashes, shells and tracer feedback.
- Procedural concrete, asphalt and steel textures; instanced static geometry, shadow maps, sky gradient, environment reflections and night lighting.
- Locally synthesized Web Audio effects: distinct weapon reports, mechanical reload sounds, footsteps, grenade blasts, stereo positional sound, cover filtering and short convolution reverberation. These are procedural effects, not field-recorded firearm samples.
- Adjustable mouse sensitivity, aim sensitivity, touch sensitivity, inverted vertical look, FOV, volume, motion, hit numbers, FPS indicator and three quality presets. Touch defaults to medium quality. Settings are stored locally using localStorage; blocked storage does not prevent play.
- Fixed 120 Hz movement simulation with bounded catch-up. Frame rate depends on the browser, display, GPU and quality preset; no universal FPS guarantee is made.

The game uses original procedural assets rather than production-scanned environments or motion-captured characters. It is a browser arena game, not a commercial AAA production. There is no online multiplayer, account system, leaderboard, Hall of Fame, seasonal scenery, analytics or telemetry. After the static files have loaded, gameplay makes no external requests. Hosting providers may still keep their normal HTTP logs.

## Development and checks

```sh
npm run check
npm test
```

Run `node tools/stamp-assets.mjs` after source changes and before uploading. This refreshes content fingerprints in CSS, the entry script and every module import so browsers do not mix old and new files.

`scripts/physics.js` contains the renderer-independent collision, line-of-sight and weapon rules. `world.js` builds the arena and navigation graph. `weapons.js` builds the weapon and opponent geometry. `audio.js` synthesizes and spatializes sound. `game.js` owns match state, inputs and rendering. `window.ZEXRA.snapshot` exposes read-only local diagnostics for browser QA.

`node tools/standalone.mjs` optionally builds an ignored `.qa/preview.html` for manual offline inspection. This is not required for deployment.

## Attribution

The user's reference was [deathsmile32/rivals-online](https://github.com/deathsmile32/rivals-online). Zexra is an independently written interpretation of the requested arena-shooter direction; the reference repository's code, branding and assets are not included.

The vendored Three.js r160 runtime is MIT-licensed. Its full license is in [vendor/THREE-LICENSE.txt](vendor/THREE-LICENSE.txt). All other game code and procedural assets are original to this project. See [LICENSE](LICENSE).
