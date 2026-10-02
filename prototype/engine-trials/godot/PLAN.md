# Godot Trial — Plan

The first engine trial. It builds the [standard horde test](../README.md#2-the-standard-horde-test) in Godot, measures it on the desktop and the Steam Deck, and keeps a log of what developing in Godot is like.

> **Status:** planned 2026-09-27, not started.
> **Not an engine decision.** Rich, 2026-09-27: "I'm just testing a Godot build, I want to see how it is to set up a build and develop for it." Unity, and possibly Unreal, may get the same trial. Q8 stays open ([design doc](../../../docs/design/design-doc.md) §11).
> **Read first:** [`../README.md`](../README.md) (the shared spec: what to build, what to measure, the log format). This file is only the Godot *how*.

**Decisions this plan follows** (Rich, 2026-09-27):

| | |
|---|---|
| Engine | **Godot 4.7.2 stable** (latest stable on 2026-09-27; released 2026-08-18) |
| Languages | **GDScript** for scene setup, the test harness and anything game-side; **C++ GDExtension** for the horde simulation |
| Dev machine | **The Linux desktop** (Ryzen 5 3600, RTX 2070) |
| First milestone | **The horde spike**, with a scripted stand-in player. The movement kit comes after, and is optional |
| Grey box | Keeps going in parallel (playtest 4). Q1 stays at "direction set" |

---

## Pinned versions

Pin these and don't upgrade mid-trial. If one has to change, note it in `LOG.md` with the reason.

| Tool | Version | Where from |
|---|---|---|
| Godot editor | **4.7.2-stable**, standard build (not .NET) | [godotengine.org/download/archive](https://godotengine.org/download/archive/) or [GitHub releases](https://github.com/godotengine/godot/releases/tag/4.7.2-stable): `Godot_v4.7.2-stable_linux.x86_64.zip` |
| Export templates | **4.7.2-stable** (must match the editor exactly) | Same page: `Godot_v4.7.2-stable_export_templates.tpz` |
| godot-cpp | **10.0.0-stable** (2026-09-15), built with `api_version=4.7` | [godotengine/godot-cpp](https://github.com/godotengine/godot-cpp), as a git submodule |
| Starting template | [godot-cpp-template](https://github.com/godotengine/godot-cpp-template) (copy its `SConstruct` and layout, not the repo) | GitHub |
| Build | Python 3.8+, **SCons 4.x**, GCC 11+ or Clang 14+ | distro / `pip` |

**Why these.** godot-cpp is **versioned separately from Godot since 10.x**. One release serves several engine versions, and you choose the API with `api_version`. An extension built for 4.7 loads in 4.7 and later, **not earlier** ([godot-cpp README](https://github.com/godotengine/godot-cpp)). Use the **official zip, not Steam or Flatpak** Godot. Steam auto-updates, which would break the pin, and the Flatpak sandbox gets in the way of attaching a native debugger.

---

## Repository layout

Everything for this trial lives under `prototype/engine-trials/godot/`. Results go under `playtests/`, like the grey box's.

```
prototype/engine-trials/
├── README.md                 # the shared spec (all engines)
├── shared/
│   └── city-seed1.json       # grey-box city, exported once (M1)
└── godot/
    ├── PLAN.md               # this file
    ├── LOG.md                # development log (from M0)
    ├── extension/            # C++ GDExtension
    │   ├── SConstruct
    │   ├── godot-cpp/        # git submodule, pinned to 10.0.0-stable
    │   └── src/              # register_types.cpp, horde_sim.{h,cpp}, …
    └── project/              # the Godot project (open this folder in the editor)
        ├── project.godot
        ├── horde.gdextension # committed
        ├── bin/              # built .so files — gitignored, built per machine
        ├── scenes/
        └── scripts/
playtests/engine-trials/godot/<date>/<runId>.json   # one file per measured run
```

**`.gitignore` additions** (in `prototype/engine-trials/godot/`):

```
project/.godot/
project/bin/*.so
project/bin/*.dll
extension/**/*.os
extension/**/*.o
extension/.sconsign*.dblite
extension/compile_commands.json
exports/
```

---

## Milestones

Each milestone ends with a **done when** check and a `LOG.md` entry. Don't start the next one until the check passes.

### M0 — Machine setup (Linux desktop)

- [ ] **Toolchain.** Install git, Python 3, SCons, a C++ compiler, and gdb:
  - Debian/Ubuntu: `sudo apt install git python3 python3-pip scons build-essential gdb clangd`
  - Fedora: `sudo dnf install git python3 scons gcc-c++ gdb clang-tools-extra`
  - Arch: `sudo pacman -S git python scons base-devel gdb clang`
  - If the distro's SCons is older than 4.0: `pip install --user scons`.
- [ ] **Godot.** Unzip `Godot_v4.7.2-stable_linux.x86_64.zip` to `~/tools/godot/4.7.2/`, and link it as `~/.local/bin/godot` so `godot` works from a shell.
- [ ] **Export templates.** Editor → *Manage Export Templates* → *Install from file* → the `.tpz`.
- [ ] **Editor tooling** (suggested, not required): VS Code with **godot-tools** (GDScript) and **clangd** (C++, reads `compile_commands.json`). Set Godot's external editor to VS Code if wanted.
- [ ] **`LOG.md`**: create it, with the first entry (how long setup took, anything that fought back).

**Done when:** `godot --version` prints `4.7.2.stable.official…`, `scons --version` prints 4.x, and the empty editor opens.

### M1 — Project skeleton and "hello GDExtension"

- [ ] `git submodule add https://github.com/godotengine/godot-cpp prototype/engine-trials/godot/extension/godot-cpp`, then `cd` into it, `git checkout 10.0.0-stable`, and commit the submodule pointer.
- [ ] Create the Godot project in `project/` (Forward+ renderer, the default; record it).
- [ ] Copy `SConstruct` from godot-cpp-template into `extension/`. Point its output at `../project/bin/`, and set the default `api_version` to `4.7` so every machine builds the same thing.
- [ ] A trivial C++ class (e.g. `HordeSim : Node3D` with one method returning a number) plus `register_types.cpp`.
- [ ] `project/horde.gdextension`:
  ```ini
  [configuration]
  entry_symbol = "horde_library_init"
  compatibility_minimum = "4.7"
  reloadable = true

  [libraries]
  linux.debug.x86_64   = "res://bin/libhorde.linux.template_debug.x86_64.so"
  linux.release.x86_64 = "res://bin/libhorde.linux.template_release.x86_64.so"
  ```
  *(Check the exact file names SCons produces and match them. Add `windows.*` lines only if a Windows build is ever needed.)*
- [ ] Build: `cd extension && scons target=template_debug debug_symbols=yes compiledb=yes`. **Time a clean build and an incremental build** for the log.
- [ ] **Hot reload:** with the editor open, change the C++ method, rebuild, and check that the editor picks it up without a restart (`reloadable = true`). Log whether it worked reliably.
- [ ] **City:** export the grey box's `mixed` layout at seed 1 to `../shared/city-seed1.json` (a list of boxes: centre, size, and whether it's a building or a car). Use a small script in `prototype/greybox/tools/` if `world.js` runs under Node. If not, add a debug-panel button in the grey box that downloads it. Then load the JSON in Godot and build the boxes (static `MeshInstance3D`s are fine at this size; there are only hundreds).
- [ ] **Stand-in player** on the scripted loop from the spec, and the fixed third-person camera.
- [ ] **Debug overlay:** FPS, frame ms, enemy count.

**Done when:** the city loads, the capsule runs its loop with the camera following, a C++ method is called from GDScript, and a rebuild shows up without restarting the editor (or the log says why it didn't).

### M2 — GDScript baseline horde

The engine report asks for a script baseline, so the native version has something to be compared against. It's also the quickest way to feel GDScript.

- [ ] **Data as arrays**, not nodes: `PackedVector3Array` / `PackedFloat32Array` / `PackedInt32Array` for position, velocity, type and state. **No node per enemy** ([`engine-options.md`](../../../docs/research/engine-options.md) §10, lessons 1 and 5).
- [ ] **Drawing:** one `MultiMeshInstance3D` per enemy type. Write all transforms at once each frame with `RenderingServer.multimesh_set_buffer()` (one packed float buffer), not per-instance `set_instance_transform()`.
- [ ] Flow field (2 m grid, BFS), spatial-hash separation with the tiered rule and the neighbour budget, ground fodder only at first.
- [ ] **The ramp and the metrics:** the ramp from the spec, and the run JSON. Sim time is measured around the horde update with `Time.get_ticks_usec()`; GPU time comes from `RenderingServer.viewport_set_measure_render_time()` + `viewport_get_measured_render_time_gpu()`. Write to `user://runs/`, and when running from the editor on the desktop also copy to `playtests/engine-trials/godot/<date>/`.
- [ ] Measure on the desktop (debug build is fine for the baseline, but record it as debug).

**Done when:** a ramp run produces a JSON file with counts held at 60/45/30 for the GDScript horde on the desktop.

### M3 — C++ horde

- [ ] Port the M2 horde into `HordeSim` (C++), with the same data layout (structure of arrays), same algorithms, same budget. GDScript only starts it, feeds it the player's position and the city, and reads counts back.
- [ ] `HordeSim` writes the MultiMesh buffers itself (`RenderingServer::multimesh_set_buffer`), so per-enemy data never passes through GDScript.
- [ ] **Single-threaded first**, measured. **Then threaded:** split integration and separation into chunks on Godot's `WorkerThreadPool` (or `std::thread` if the pool is awkward from godot-cpp; log which and why). Measure again.
- [ ] Watch lesson 6 from the engine report: keep index bookkeeping in one place, so a removed enemy can't leave a ghost in the hash or the MultiMesh.
- [ ] **Release build** for measuring: `scons target=template_release`, and run an exported release build, not the editor.

**Done when:** the run JSON has counts for C++ single-threaded and C++ threaded, release build, desktop, next to the M2 baseline.

### M4 — Full standard test

- [ ] **Climbers** (30%): scale the wall between them and a higher player.
- [ ] **Flyers** (25%): straight at the player, with vertical separation.
- [ ] **Bosses** (4 alive): larger radius, push, and are never pushed.
- [ ] **Spawn ring and relocation** at the grey box's distances.
- [ ] **Projectile stress load** (500 player projectiles, enemy bullets) in C++, each type in its own MultiMesh, hits through the hash.
- [ ] **Fixed-count runs** (550 / 2,000 / 5,000 for 60 s), plus the ramp, three runs each, and a shadows-on variant.

**Done when:** the full test runs from one scene with one key or command-line flag (e.g. `--ramp`, `--fixed=2000`), and produces run JSON files on the desktop, both unpinned and pinned to 4 cores (`taskset -c 0-3 ./thriver-godot.x86_64 --ramp`).

### M5 — Steam Deck

- [ ] **Export preset:** Linux, x86_64, release, **fullscreen 1280×800**, vsync off. The release `.so` must exist (`scons target=template_release`) before exporting; the exporter copies it in beside the binary.
- [ ] **Deploy.** Pick one and log how it went:
  - **SSH + rsync** (simplest to repeat). On the Deck, in desktop mode, set a password (`passwd`) and run `sudo systemctl enable --now sshd`. From the desktop: `rsync -av exports/linux/ deck@<deck-ip>:~/thriver-trials/godot/`. Add the binary to Steam as a **non-Steam game** once.
  - **SteamOS Devkit Client** (from Steam's Tools list). It uploads a folder and makes a `devkit:` entry in the Deck's library. There is also a Godot plugin for it, *Godot4-DeployToSteamOS* ([Steam Deck HQ](https://steamdeckhq.com/news/plugin-godot-4-games-to-steamos-devkit/)).
- [ ] **Measure in Game Mode**, not desktop mode, with the Steam frame-rate limit **off**, TDP left at default, and the Deck on its charger. Note the model (LCD / OLED).
- [ ] **Command-line flags** for the ramp and the fixed counts: add them to the non-Steam shortcut's launch options.
- [ ] **Fetch the results:** run files are in `~/.local/share/godot/app_userdata/<project name>/runs/` on the Deck. `rsync` them back into `playtests/engine-trials/godot/<date>/`.
- [ ] Controller: the standard test needs no input, but check that the Deck's controls work in the build (there's a [4.8-dev regression report](https://github.com/godotengine/godot/issues/123704) about Deck controls; 4.7.2 should be unaffected, so just confirm).

**Done when:** Deck run files exist for the ramp and the three fixed counts (median of three), C++ threaded, release.

### M6 — Write up

- [ ] Finish `LOG.md` with the summary table from the [shared spec §4](../README.md#4-the-development-log).
- [ ] Add a **"Godot trial results"** section to [`engine-options.md`](../../../docs/research/engine-options.md), with the Deck numbers against 550 / 2,000 / 5,000, the desktop numbers for comparison, the GDScript vs C++ vs threaded gap, and the log summary. Research findings, with the run files as sources.
- [ ] Update the design doc's Q2 and Q8 entries (§11, §13) with **what was measured**. **Not** a decision; Q8 waits for Rich.
- [ ] Commit code, log and run files.

### M7 — Movement feel (optional, after M6)

Only if Rich wants to feel gameplay code in Godot before the next trial. See the [shared spec §5](../README.md#5-after-the-standard-test-optional).

- [ ] `CharacterBody3D` with a **custom** kinematic controller (not `move_and_slide`'s defaults alone): run, jump, double jump, wall run, dash, using the grey box's `config.js` values (`moveSpeed: 9`, `dashSpeed: 30`, `wallRunUpSpeed: 9`, …).
- [ ] **The wall-jump refresh is an explicit rule** (`wallJumpRefresh`, off by default; on with Wall kick), with a test that checks it: jumps refill on wall touch only when it's on. Don't rely on however Godot's floor and wall detection happens to behave (design doc §6, §11).
- [ ] Player-controlled camera with collision (`SpringArm3D` is the quick version).
- [ ] Log: how GDScript felt for gameplay code, how Jolt (built in since 4.4) handled the controller's shape casts.

---

## Continuing on another machine

The repo is the handover. Everything needed is either committed or rebuilt from committed files.

```bash
git clone https://github.com/MstrDialUp/thriver.git
cd thriver
git checkout <trial branch>
git submodule update --init --recursive          # fetches godot-cpp at the pinned commit
# install the M0 toolchain and Godot 4.7.2 + templates on this machine
cd prototype/engine-trials/godot/extension
scons target=template_debug debug_symbols=yes compiledb=yes   # .so files are not committed
godot --path ../project -e                        # open the editor
```

Then read `LOG.md`'s last entry and the first unticked box above. **Before switching machines,** tick the boxes that are done, write the log entry, commit, and push.

**Hazards when switching:**
- **The `.so` files are per machine.** A missing library shows up as a "GDExtension failed to load" error in the editor, and scripts that use `HordeSim` will fail. Rebuild.
- **Same Godot version everywhere.** Opening the project in a different 4.x can silently rewrite `project.godot` and resources. Check `godot --version` first.
- **The repo on the Windows machine** lives at `C:\home\thriver` and is used from WSL. Builds of a Linux `.so` in WSL on the Windows filesystem work but are slow (cross-filesystem I/O). If this trial is ever continued there, clone into the WSL filesystem instead. The plan assumes the Linux desktop.

---

## Risks to watch

| Risk | What to do |
|---|---|
| Hot reload of GDExtension is unreliable | Log it (it's a dev-experience finding), and fall back to restarting the editor |
| godot-cpp 10.0 is two weeks old | If it fights back, log it and try the `godot-4.5-stable` tag (loads in 4.7, older API) as a comparison, rather than debugging the binding for long |
| GDScript baseline too slow to reach even the floor | That's a result, not a failure. Record it and move to M3 |
| Scope creep into gameplay | The shared spec's §5 is the limit. No weapons, progression, art or UI |
| Numbers from the editor or a debug build | Only exported **release** builds count for M3–M5 |

## Sources

- Godot 4.7.2 release: [GitHub releases](https://github.com/godotengine/godot/releases) (2026-08-18)
- godot-cpp 10.0.0-stable, versioning and `api_version`: [godotengine/godot-cpp](https://github.com/godotengine/godot-cpp), [tags](https://github.com/godotengine/godot-cpp/tags)
- Steam Deck deployment: [Running Godot Games on Steam Deck](https://www.gogogodot.io/running-godot-games-on-steam-deck/), [Exporting for Steam Deck with Godot (SSH)](https://drewler.net/blog/2023/12/godot-steam-deck-export-ssh), [Steam Deck in Godot workflow (rsync)](https://manuelsanchezdev.com/blog/steam-deck-godot-workflow-local-testing-ssh/), [Godot4-DeployToSteamOS plugin](https://steamdeckhq.com/news/plugin-godot-4-games-to-steamos-devkit/)
- Why the horde is data plus instancing: [`engine-options.md`](../../../docs/research/engine-options.md) §5.1, §10, §11
