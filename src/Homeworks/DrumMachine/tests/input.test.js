import test from "node:test";
import assert from "node:assert/strict";
import { bindKeyboard } from "../js/input.js";

class EventTargetMock {
  listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ type, ...event });
    }
  }
}

function installKeyboard() {
  const target = new EventTargetMock();
  globalThis.window = target;
  const hits = [];
  const releases = [];
  const dispose = bindKeyboard({
    isBound: (code) => ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"].includes(code),
    onHit: (code) => hits.push(code),
    onRelease: (code) => releases.push(code),
  });
  return { target, hits, releases, dispose };
}

test("mapped physical key codes hit once and repeated, modified, or unmapped keys are ignored", () => {
  const { target, hits } = installKeyboard();
  target.dispatch("keydown", { code: "KeyA" });
  target.dispatch("keydown", { code: "KeyA", repeat: true });
  target.dispatch("keydown", { code: "KeyA", ctrlKey: true });
  target.dispatch("keydown", { code: "KeyA", metaKey: true });
  target.dispatch("keydown", { code: "KeyA", altKey: true });
  target.dispatch("keydown", { code: "KeyQ" });
  target.dispatch("keydown", { code: "KeyS", keyCode: 229 });
  assert.deepEqual(hits, ["KeyA", "KeyS"]);
});

test("typing targets and IME composition do not trigger hits", () => {
  const { target, hits } = installKeyboard();
  for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
    target.dispatch("keydown", { code: "KeyA", target: { tagName } });
  }
  target.dispatch("keydown", { code: "KeyA", target: { isContentEditable: true } });
  target.dispatch("keydown", { code: "KeyA", isComposing: true });
  target.dispatch("keydown", { code: "KeyA", target: { closest: () => ({}) } });
  assert.deepEqual(hits, []);
});

test("keyup and window blur release each active physical key", () => {
  const { target, hits, releases } = installKeyboard();
  target.dispatch("keydown", { code: "KeyA" });
  target.dispatch("keydown", { code: "KeyS" });
  target.dispatch("keyup", { code: "KeyA" });
  target.dispatch("blur");
  target.dispatch("blur");
  assert.deepEqual(hits, ["KeyA", "KeyS"]);
  assert.deepEqual(releases, ["KeyA", "KeyS"]);
});

test("cleanup removes all registered keyboard listeners", () => {
  const { target, hits, dispose } = installKeyboard();
  dispose();
  target.dispatch("keydown", { code: "KeyA" });
  target.dispatch("keyup", { code: "KeyA" });
  target.dispatch("blur");
  assert.deepEqual(hits, []);
});
