import { readContract } from "./contract.js";
import { createAudioEngine } from "./audio-engine.js";
import { bindKeyboard } from "./input.js";
import { createRecorder } from "./recorder.js";
import { createHitHandler } from "./hit-controller.js";

const contract = readContract();
const engine = createAudioEngine();
const recorder = createRecorder();

engine.preload([...contract.values()].map((pad) => pad.sound));

const hitLog = document.getElementById("hit-log");
const emptyHistory = document.getElementById("hit-empty");
const activityMeter = document.querySelector(".activity-meter");
let hitCount = 0;
let meterTimer;

function appendHit(code) {
  const pad = contract.get(code);
  if (!pad) return;
  const label = pad.el.querySelector("span")?.textContent.trim() || code;
  const entry = document.createElement("li");
  entry.textContent = `${++hitCount}. ${label} (${code.replace(/^Key/, "")})`;
  hitLog.append(entry);
  while (hitLog.children.length > 10) {
    hitLog.firstElementChild.remove();
  }
  emptyHistory.hidden = true;
}

function pulseMeter() {
  activityMeter.classList.add("active");
  clearTimeout(meterTimer);
  meterTimer = setTimeout(() => activityMeter.classList.remove("active"), 220);
}

const { handleHit, releaseHit } = createHitHandler({
  contract,
  engine,
  recorder,
  onHit: appendHit,
  onMeter: pulseMeter,
});

for (const [code, pad] of contract) {
  pad.el.addEventListener("click", () => handleHit(code));
}

bindKeyboard({
  isBound: (code) => contract.has(code),
  onHit: (code) => handleHit(code, { held: true }),
  onRelease: releaseHit,
});

const rec = document.getElementById("rec");
const stop = document.getElementById("stop");
const play = document.getElementById("play");
const status = document.getElementById("status");

rec.onclick = () => {
  recorder.start();
  rec.disabled = true;
  stop.disabled = false;
  play.disabled = true;
  status.textContent = "Recording...";
};

stop.onclick = () => {
  recorder.stop();
  rec.disabled = false;
  stop.disabled = true;
  play.disabled = recorder.length === 0;
  status.textContent = "Saved " + recorder.length + " hits";
};

play.onclick = () => {
  play.disabled = true;
  rec.disabled = true;
  status.textContent = "Playing...";
  recorder.play((code) => handleHit(code, { record: false }), () => {
    play.disabled = false;
    rec.disabled = false;
    status.textContent = "Idle";
  });
};
