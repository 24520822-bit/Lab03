# Production Studio Drum Kit

A browser-based drum kit built with HTML, CSS, and JavaScript modules. It keeps the original nine sounds and adds accessible keyboard controls, a visual hit log, and a decorative activity meter.

## Run locally

From this folder, start a local web server:

```powershell
python -m http.server 8765
```

Open `http://localhost:8765` in a browser. Use `Ctrl+C` in the terminal to stop the server.

## Controls

- Play the nine drum pads with `A`, `S`, `D`, `F`, `G`, `H`, `J`, `K`, and `L`.
- Or Tab to a pad and activate it with Enter or Space.
- Record a performance with **Record**, finish with **Stop**, and replay with **Play**.
- The hit log keeps the latest 10 hits. The meter is visual feedback only; it does not measure sound pressure or decibels.

## Tests

Requires Node.js 20 or newer. No packages need to be installed.

```powershell
npm test
```
