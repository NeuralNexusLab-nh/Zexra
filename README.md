# Zexra

A fully static browser arena shooter by NXLabTW. English interface, technology-purple identity, keyboard/mouse and touch controls. No account system, database, server functions or external asset CDN.

## Play

Open https://neuralnexuslab-nh.github.io/Zexra/ and select **PLAY**. Arena, difficulty and deploy controls stay pinned at the top while the mode list scrolls. Choose an independent elimination mode (1v1 to 5v5), Team Deathmatch, Free for All or a special operation, then deploy.

- **1v1, 2v2, 3v3, 4v4, 5v5:** independent round-elimination modes. One life per round, no mid-round respawns, first team to five rounds. A round lasts up to 90 seconds; timeout compares surviving players, then remaining health. A tie replays without a point.
- **Team Deathmatch:** separate 5v5 respawn mode. First team to 50 eliminations, or highest team score after five minutes. Friendly fire is disabled.
- **Free for All:** separate ten-player respawn mode. First to 25 eliminations, or highest score after five minutes.
- **Dead Signal:** solo zombie survival in **The Hollow**, a separate abandoned cemetery with memorial ruins, fog, moonlight and violet security lights. Recruit, Regular and Elite affect wave population, health, speed, melee damage and attack timing. Waves progressively increase in number, health and movement speed. Infected pursue through cover and attack at melee range after a dodgeable wind-up. Survive an entire wave to restore reserve ammunition, recover health and gain a grenade before the next wave. Death ends the run. Active infected are capped at 18 to bound rendering and navigation costs.
- **Shooting Range:** six moving targets, unlimited reserve ammunition and grenade replenishment.

**Arena selection:** Drydock, Nightshift, Overpass, Substation and Quarry are available in every arena mode, including Shooting Range. Only Dead Signal locks its map to The Hollow. The three added arenas use different obstacle layouts and routes, not just lighting changes.

Regular bots react after 1.15 seconds of continuous sight, fire short three-shot bursts with breathing room, deal reduced damage and aim for the torso with wider error. Recruit is easier; Elite retains a faster response.

All participants other than you are local AI. There is no online multiplayer or matchmaking service.

## Arsenal

Seven freely available primary weapons: **AK-47, VCR-2, MP5, AWP, M1 Garand, P90 and Barrett M82A1**. Every loadout also includes a P-19 sidearm, tactical knife and two grenades.

The P90 uses a distinct compact bullpup model, a top-mounted 50-round magazine, its own fire rate, recoil and upward magazine exchange. Every magazine-fed weapon has separate seated, removed and fresh magazine models, synchronized hand movement, insertion and charging. The M1 Garand uses a top-loaded en-bloc clip. Non-magnified optics use a wide rectangular window and central red dot; AWP and Barrett use magnified scopes. The AWP has a clear magnified optic and a bolt-action cycle; the M1 Garand uses an eight-round clip and an empty-clip ping. The VCR-2 silhouette follows the BF6 bullpup layout. Weapon names identify game interpretations, not manufacturer-approved simulations.

## Controls

| Action | Input |
| --- | --- |
| Move / look | WASD / mouse |
| Fire / aim | Left / right mouse |
| Sprint | Shift |
| Crouch / slide while sprinting | Ctrl or C |
| Jump | Space |
| Reload | R |
| Primary / sidearm / knife | 1 / 2 / 3 or wheel |
| Grenade / inspect | G / F |
| Pause | Escape |
| Full screen | Alt + Enter |

Touch devices use the left stick for movement, right-side drag for look and separate action buttons. Full stick deflection sprints. Landscape is recommended; portrait and tablet layouts are included.

Resume retries mouse capture from the user's click and restores canvas focus. Automatic respawn preserves an existing pointer lock and clears stale deltas without making a new permission request. If the browser rejects capture, free look continues while the pointer is over the canvas, and the next click retries capture. Leaving the tab pauses the game. The canvas cursor is hidden during play and restored in menus.

## Local preview and deployment

Requires Node.js 20.11+ for the optional preview server. No npm packages are required. On Windows, double-click **Start-Zexra.cmd**, or run:

```sh
npm start
```

Open **http://localhost:65535**. Keep the server running while playing. The preview server is a development tool; production deployment is completely static.

For GitHub Pages, use **Settings / Pages / Deploy from a branch / main / root**. All asset paths are relative and support project subpaths. Before publishing source changes, run:

```sh
npm run check
node tools/stamp-assets.mjs
npm test
```

Asset fingerprints cover styles, the entry script and all imported modules, preventing mixed cached versions. An optional offline QA bundle can be created with **node tools/standalone.mjs**; it is excluded from Git.

## Implementation and limits

Movement uses a fixed 120 Hz simulation and bounded catch-up. The renderer uses procedural assets, instanced environment geometry, cached static shadow maps and lightweight moving contact shadows. Three quality settings are available. Frame rates depend on hardware, browser and other running applications; a universal 60 FPS target is not guaranteed.

Audio is locally synthesized using Web Audio: gun reports, reload mechanisms, footsteps, spatial infected growls, wind, low horror ambience, grenade blasts and reverberation. These are procedural effects, not field-recorded firearm samples. Models and animations are procedural rather than scanned or motion-captured assets. This is a browser game, not a commercial AAA production.

Preferences stay in localStorage. Blocked local storage does not prevent play. The game sends no telemetry or gameplay data; hosts may retain their ordinary HTTP logs. WebGL and hardware acceleration are required. Gamepad and VR input are not implemented.

## Attribution

The user's original reference was https://github.com/deathsmile32/rivals-online. Zexra is independently written; that repository's code, branding and assets are not included. Three.js r160 is vendored under its MIT license in **vendor/THREE-LICENSE.txt**. All other project code and procedural assets are copyright **NXLabTW**; see **LICENSE**.
