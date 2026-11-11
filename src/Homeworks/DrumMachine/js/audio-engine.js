export function createAudioEngine() {
  const cache = new Map();

  function load(src) {
    if (!cache.has(src)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      cache.set(src, audio);
    }
    return cache.get(src);
  }

  return {
    preload(sources) {
      sources.forEach(load);
    },

    play(src) {
      const voice = load(src).cloneNode();
      voice.currentTime = 0;
      voice
        .play()
        .catch((err) => console.warn("Audio play failed:", src, err.name));
      return voice;
    },
  };
}
