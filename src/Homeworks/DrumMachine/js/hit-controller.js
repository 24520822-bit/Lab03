export function createHitHandler({
  contract,
  engine,
  recorder,
  onHit = () => {},
  onMeter = () => {},
  pulseDuration = 100,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  const held = new Set();
  const pulses = new Map();

  function setActive(code, active) {
    const pad = contract.get(code)?.el;
    if (!pad) return;
    pad.classList.toggle("playing", active);
    pad.setAttribute("aria-pressed", String(active));
  }

  function cancelPulse(code) {
    const timer = pulses.get(code);
    if (timer === undefined) return;
    cancel(timer);
    pulses.delete(code);
  }

  function handleHit(code, { record = true, held: isHeld = false } = {}) {
    const pad = contract.get(code);
    if (!pad) return;

    engine.play(pad.sound);
    if (record) recorder.capture(code);
    onHit(code);
    onMeter(code);

    cancelPulse(code);
    if (isHeld) {
      held.add(code);
    } else {
      const timer = schedule(() => {
        pulses.delete(code);
        setActive(code, held.has(code));
      }, pulseDuration);
      pulses.set(code, timer);
    }
    setActive(code, true);
  }

  function releaseHit(code) {
    held.delete(code);
    if (!pulses.has(code)) setActive(code, false);
  }

  return {
    handleHit,
    releaseHit,
  };
}
