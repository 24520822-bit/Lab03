export function readContract(root = document) {
  const map = new Map();

  root.querySelectorAll("[data-key][data-sound]").forEach((el) => {
    const code = el.dataset.key;
    if (map.has(code)) console.warn("Duplicate binding: " + code);
    map.set(code, { el, sound: el.dataset.sound });

    const label = el.querySelector("kbd");
    if (label) label.textContent = code.replace(/^Key|^Digit/, "");
  });

  return map;
}
