export class AudioManager {
  constructor({ masterVolume = 1, bgmVolume = 0.6, sfxVolume = 0.9 } = {}) {
    this.masterVolume = masterVolume;
    this.bgmVolume = bgmVolume;
    this.sfxVolume = sfxVolume;
    this.muted = false;
    this.unlocked = false;

    this.currentBgm = null;
    this.currentBgmSrc = null;
    this.currentBgmBaseVolume = null;
    this.fadeTimer = null;

    this.sfxCache = new Map();
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (typeof Audio !== "undefined") {
      const probe = new Audio();
      probe.muted = true;
      probe.play?.().catch(() => {});
    }
  }

  _resolveEntry(entry) {
    if (!entry) return { src: null, volume: undefined };
    if (typeof entry === "string") return { src: entry, volume: undefined };
    return { src: entry.src ?? null, volume: entry.volume };
  }

  playBgm(entry, { loop = true, fadeMs = 600, volume } = {}) {
    const { src, volume: entryVolume } = this._resolveEntry(entry);
    if (!src || this.currentBgmSrc === src) return;
    if (typeof Audio === "undefined") return;

    const baseVolume = volume ?? entryVolume ?? this.bgmVolume;
    const targetVolume = baseVolume * this.masterVolume;
    const next = new Audio(src);
    next.loop = loop;
    next.volume = 0;
    next.preload = "auto";

    const prev = this.currentBgm;
    this.currentBgm = next;
    this.currentBgmSrc = src;
    this.currentBgmBaseVolume = baseVolume;

    const playPromise = next.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn("[AudioManager] BGM 播放被拒:", src, err.message);
        if (this.currentBgm === next) {
          this.currentBgm = null;
          this.currentBgmSrc = null;
          this.currentBgmBaseVolume = null;
        }
      });
    }

    this._fade(next, 0, this.muted ? 0 : targetVolume, fadeMs);
    if (prev) {
      this._fade(prev, prev.volume, 0, fadeMs, () => {
        prev.pause();
        prev.src = "";
      });
    }
  }

  stopBgm({ fadeMs = 400 } = {}) {
    const prev = this.currentBgm;
    if (!prev) return;
    this.currentBgm = null;
    this.currentBgmSrc = null;
    this.currentBgmBaseVolume = null;
    this._fade(prev, prev.volume, 0, fadeMs, () => {
      prev.pause();
      prev.src = "";
    });
  }

  playSfx(entry, { volume } = {}) {
    const { src, volume: entryVolume } = this._resolveEntry(entry);
    if (!src || this.muted) return;
    if (typeof Audio === "undefined") return;

    const baseVolume = volume ?? entryVolume ?? this.sfxVolume;
    const targetVolume = baseVolume * this.masterVolume;

    let template = this.sfxCache.get(src);
    if (!template) {
      template = new Audio(src);
      template.preload = "auto";
      this.sfxCache.set(src, template);
    }

    const instance = template.cloneNode();
    instance.volume = Math.max(0, Math.min(1, targetVolume));
    const playPromise = instance.play();
    if (playPromise) {
      playPromise.catch((err) => console.warn("[AudioManager] SFX 播放被拒:", src, err.message));
    }
  }

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.currentBgm) {
      const base = this.currentBgmBaseVolume ?? this.bgmVolume;
      this.currentBgm.volume = this.muted ? 0 : base * this.masterVolume;
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.currentBgm) {
      const base = this.currentBgmBaseVolume ?? this.bgmVolume;
      this.currentBgm.volume = this.muted ? 0 : base * this.masterVolume;
    }
  }

  _fade(audio, from, to, durationMs, onDone) {
    if (durationMs <= 0) {
      audio.volume = to;
      onDone?.();
      return;
    }
    const startedAt = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startedAt) / durationMs);
      audio.volume = from + (to - from) * t;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    requestAnimationFrame(tick);
  }
}
