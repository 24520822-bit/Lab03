import test from "node:test";
import assert from "node:assert/strict";
import { createHitHandler } from "../js/hit-controller.js";

function createHarness() {
  const classes = new Set();
  const attributes = new Map([["aria-pressed", "false"]]);
  const timers = new Map();
  const effects = { audio: [], recorded: [], hits: [], meters: [] };
  let nextTimer = 1;
  const pad = {
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
      toggle: (value, force) => {
        if (force) classes.add(value);
        else classes.delete(value);
      },
    },
    setAttribute: (name, value) => attributes.set(name, value),
  };
  const controller = createHitHandler({
    contract: new Map([["KeyA", { el: pad, sound: "sounds/clap.wav" }]]),
    engine: { play: (sound) => effects.audio.push(sound) },
    recorder: { capture: (code) => effects.recorded.push(code) },
    onHit: (code) => effects.hits.push(code),
    onMeter: (code) => effects.meters.push(code),
    pulseDuration: 100,
    schedule: (callback, delay) => {
      const id = nextTimer++;
      timers.set(id, { callback, delay });
      return id;
    },
    cancel: (id) => timers.delete(id),
  });
  return { controller, classes, attributes, effects, timers };
}

test("live hits play audio, record the code, update visuals, and pulse back to idle", () => {
  const { controller, classes, attributes, effects, timers } = createHarness();
  controller.handleHit("KeyA");
  assert.deepEqual(effects.audio, ["sounds/clap.wav"]);
  assert.deepEqual(effects.recorded, ["KeyA"]);
  assert.deepEqual(effects.hits, ["KeyA"]);
  assert.deepEqual(effects.meters, ["KeyA"]);
  assert.equal(classes.has("playing"), true);
  assert.equal(attributes.get("aria-pressed"), "true");
  timers.get(1).callback();
  assert.equal(classes.has("playing"), false);
  assert.equal(attributes.get("aria-pressed"), "false");
});

test("replay hits produce feedback without recording again", () => {
  const { controller, effects } = createHarness();
  controller.handleHit("KeyA", { record: false });
  assert.deepEqual(effects.audio, ["sounds/clap.wav"]);
  assert.deepEqual(effects.recorded, []);
  assert.deepEqual(effects.hits, ["KeyA"]);
  assert.deepEqual(effects.meters, ["KeyA"]);
});

test("held keys remain active until release and release does not play audio", () => {
  const { controller, classes, attributes, effects } = createHarness();
  controller.handleHit("KeyA", { held: true });
  controller.releaseHit("KeyA");
  assert.deepEqual(effects.audio, ["sounds/clap.wav"]);
  assert.equal(classes.has("playing"), false);
  assert.equal(attributes.get("aria-pressed"), "false");
});

test("rapid pulse retriggers cancel old timers without shortening the new state", () => {
  const { controller, classes, attributes, timers } = createHarness();
  controller.handleHit("KeyA");
  controller.handleHit("KeyA");
  assert.equal(timers.size, 1);
  assert.equal(timers.get(2).delay, 100);
  timers.get(2).callback();
  assert.equal(classes.has("playing"), false);
  assert.equal(attributes.get("aria-pressed"), "false");
});

test("unmapped codes have no side effects", () => {
  const { controller, effects } = createHarness();
  controller.handleHit("KeyQ");
  assert.deepEqual(effects, { audio: [], recorded: [], hits: [], meters: [] });
});
