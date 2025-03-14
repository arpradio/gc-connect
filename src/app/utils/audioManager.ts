type AudioHandler = {
  play: () => void;
  pause: () => void;
  stop: () => void;
};

type PlayOptions = {
  startTime?: number;
  duration?: number;
  onError?: (error: Error) => void;
};

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentHandler: AudioHandler | null = null;
  private handlers: Set<AudioHandler> = new Set();
  private playbackTimer: number | null = null;
  private fadeInterval: number | null = null;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private readonly FADE_DURATION = 2300;
  private readonly INITIAL_VOLUME = 0.1;
  private readonly PEAK_VOLUME = 0.8;
  private readonly MAX_CACHE_SIZE = 10;

  register(handler: AudioHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private fadeIn(audio: HTMLAudioElement) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    audio.volume = this.INITIAL_VOLUME;

    let currentVolume = this.INITIAL_VOLUME;
    const volumeStep = (this.PEAK_VOLUME - this.INITIAL_VOLUME) / (this.FADE_DURATION / 50);

    this.fadeInterval = setInterval(() => {
      currentVolume += volumeStep;
      if (currentVolume >= this.PEAK_VOLUME) {
        audio.volume = this.PEAK_VOLUME;
        clearInterval(this.fadeInterval!);
        this.fadeInterval = null;
      } else {
        audio.volume = currentVolume;
      }
    }, 50) as unknown as number;
  }

  private fadeOut(audio: HTMLAudioElement, onComplete?: () => void) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    let currentVolume = audio.volume;
    const volumeStep = currentVolume / (this.FADE_DURATION / 50);

    this.fadeInterval = setInterval(() => {
      currentVolume -= volumeStep;
      if (currentVolume <= this.INITIAL_VOLUME) {
        audio.volume = 0;
        clearInterval(this.fadeInterval!);
        this.fadeInterval = null;
        onComplete?.();
      } else {
        audio.volume = currentVolume;
      }
    }, 50) as unknown as number;
  }

  async preloadAudio(src: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(src)) {
      return this.audioCache.get(src)!;
    }

    const audio = new Audio();
    const loadPromise = new Promise<HTMLAudioElement>((resolve, reject) => {
      const onCanPlayThrough = () => {
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        audio.removeEventListener('error', onError);
        resolve(audio);
      };

      const onError = (e: ErrorEvent) => {
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        audio.removeEventListener('error', onError);
        reject(new Error(`Failed to load audio: ${e.message}`));
      };

      audio.addEventListener('canplaythrough', onCanPlayThrough);
      audio.addEventListener('error', onError);
    });

    audio.src = src;
    audio.load();

    this.audioCache.set(src, audio);

    if (this.audioCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.audioCache.delete(oldestKey);
      }
    }

    return loadPromise;
  }

  play(audio: HTMLAudioElement, handler: AudioHandler, options: PlayOptions = {}) {
    const { startTime = 18, duration = 18, onError } = options;

    if (this.currentAudio) {
      this.pause();
    }

    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
    }

    try {
      if (startTime > 0) {
        audio.currentTime = startTime;
      }

      this.currentAudio = audio;
      this.currentHandler = handler;

      this.fadeIn(audio);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
          onError?.(error);
          this.pause();
        });
      }

      handler.play();

      this.playbackTimer = setTimeout(() => {
        this.pause();
      }, duration * 1000) as unknown as number;

      this.handlers.forEach(h => {
        if (h !== handler) {
          h.stop();
        }
      });

      const endHandler = () => {
        if (this.playbackTimer) {
          clearTimeout(this.playbackTimer);
        }
        this.pause();
        audio.removeEventListener('ended', endHandler);
      };
      audio.addEventListener('ended', endHandler);

    } catch (error) {
      console.error("Error in play method:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  pause() {
    if (this.currentAudio) {
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
        this.playbackTimer = null;
      }

      this.fadeOut(this.currentAudio, () => {
        if (this.currentAudio) {
          try {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;

            this.currentHandler?.pause();
            this.handlers.forEach(h => h.stop());

            this.currentAudio = null;
            this.currentHandler = null;
          } catch (error) {
            console.error("Error in pause method:", error);
          }
        }
      });
    }
  }

  getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }

  isPlaying(audio: HTMLAudioElement): boolean {
    return this.currentAudio === audio && !audio.paused;
  }
}

export const audioManager = new AudioManager();