import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const css = await readFile(new URL("style.css", root), "utf8");

test("all nine drum pads are native buttons with their existing physical key mappings", () => {
  const pads = [...html.matchAll(/<button\b(?=[^>]*class="pad")([^>]*)>/g)];
  assert.equal(pads.length, 9);
  assert.deepEqual(
    pads.map(([, attributes]) => attributes.match(/data-key="([^"]+)"/)?.[1]),
    ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"],
  );
  assert.deepEqual(
    pads.map(([, attributes]) => attributes.match(/data-sound="([^"]+)"/)?.[1]),
    [
      "sounds/clap.wav",
      "sounds/hihat.wav",
      "sounds/kick.wav",
      "sounds/openhat.wav",
      "sounds/boom.wav",
      "sounds/ride.wav",
      "sounds/snare.wav",
      "sounds/tom.wav",
      "sounds/tink.wav",
    ],
  );
  assert.ok(pads.every(([, attributes]) => /\btype="button"/.test(attributes)));
});

test("pad controls keep a visible keyboard focus indicator", () => {
  assert.match(css, /\.pad:focus-visible\s*\{[^}]*outline:/s);
});

test("pad boundaries meet non-text contrast against their surface", () => {
  const padStyles = css.match(/\.pad\s*\{([^}]+)\}/)?.[1] ?? "";
  const color = "(#[0-9a-f]{3}(?:[0-9a-f]{3})?)";
  const background = padStyles.match(new RegExp(`background:\\s*${color}`, "i"))?.[1];
  const border = padStyles.match(new RegExp(`border:\\s*2px solid\\s*${color}`, "i"))?.[1];
  assert.ok(background && border, "pad background and border colors are declared");

  const luminance = (color) => {
    const digits = color.slice(1);
    const channels = (digits.length === 3 ? [...digits].map((value) => value.repeat(2)) : digits.match(/.{2}/g))
      .map((channel) => parseInt(channel, 16) / 255);
    const linear = channels.map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const contrast = (luminance(border) + 0.05) / (luminance(background) + 0.05);
  assert.ok(contrast >= 3, `expected at least 3:1 contrast, received ${contrast.toFixed(2)}:1`);
});

test("hit history is a polite, non-atomic live log capped in the UI", async () => {
  assert.match(html, /role="log"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-atomic="false"/);
  const main = await readFile(new URL("js/main.js", root), "utf8");
  assert.match(main, /hitLog\.children\.length\s*>\s*10/);
  assert.match(main, /hitLog\.firstElementChild\.remove\(\)/);
});

test("activity meter is decorative and does not claim measured decibels", async () => {
  assert.match(html, /class="activity-meter"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /\bdB\b/i);
});
