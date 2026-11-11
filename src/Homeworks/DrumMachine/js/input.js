const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

function isEditableTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  return Boolean(target.closest?.(EDITABLE_SELECTOR));
}

export function bindKeyboard({ isBound, onHit, onRelease = () => {} }) {
  const pressed = new Set();

  function release(code) {
    if (!pressed.delete(code)) return;
    onRelease(code);
  }

  function releaseAll() {
    for (const code of [...pressed]) release(code);
  }

  function onKeyDown(event) {
    if (event.repeat || event.isComposing) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;
    if (!isBound(event.code) || pressed.has(event.code)) return;

    pressed.add(event.code);
    onHit(event.code);
  }

  function onKeyUp(event) {
    release(event.code);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseAll);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", releaseAll);
    releaseAll();
  };
}
