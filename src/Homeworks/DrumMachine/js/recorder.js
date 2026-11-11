export function createRecorder() {
  let queue = [];
  let startTime = 0;
  let recording = false;
  let timers = [];

  function cancel() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  return {
    get isRecording() {
      return recording;
    },
    get length() {
      return queue.length;
    },

    start() {
      cancel();
      queue = [];
      startTime = performance.now();
      recording = true;
    },

    stop() {
      recording = false;
    },

    capture(code) {
      if (!recording) return;
      queue.push({ code, t: performance.now() - startTime });
    },

    play(trigger, onDone) {
      cancel();
      const pending = [...queue];
      while (pending.length > 0) {
        const event = pending.shift();
        timers.push(setTimeout(() => trigger(event.code), event.t));
      }
      const end = queue.length ? queue[queue.length - 1].t + 300 : 0;
      timers.push(setTimeout(() => onDone && onDone(), end));
    },

    cancel,
  };
}
