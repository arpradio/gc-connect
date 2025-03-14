import React, { createContext, useContext, useReducer, useRef, useEffect, ReactNode, useCallback } from "react";
import {
  TrackType,
  PlaybackState,
  EqualizerSettings,
  PlaybackAction,
  MusicContextType
} from "@/types";

// Audio processing class for the equalizer
class AudioProcessor {
  context: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private connected: boolean = false;

  constructor(private audioElement: HTMLAudioElement | null) { }

  connect(): void {
    if (!this.audioElement || this.connected) return;

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sourceNode = this.context.createMediaElementSource(this.audioElement);

      this.bassFilter = this.context.createBiquadFilter();
      this.midFilter = this.context.createBiquadFilter();
      this.trebleFilter = this.context.createBiquadFilter();
      this.gainNode = this.context.createGain();

      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 200;

      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 0.5;

      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 3000;

      // Connect nodes individually instead of chaining for better browser compatibility
      this.sourceNode.connect(this.bassFilter);
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.gainNode);
      this.gainNode.connect(this.context.destination);

      this.connected = true;

      // Apply initial settings
      this.setVolume(this.audioElement.volume);
    } catch (error) {
      console.error('Failed to setup Web Audio API:', error);
    }
  }

  setEQ(options: { bass: number; mid: number; treble: number }): void {
    if (!this.connected) return;

    if (this.bassFilter) this.bassFilter.gain.value = options.bass;
    if (this.midFilter) this.midFilter.gain.value = options.mid;
    if (this.trebleFilter) this.trebleFilter.gain.value = options.treble;
  }

  setVolume(volume: number): void {
    if (this.gainNode) this.gainNode.gain.value = volume;
  }

  disconnect(): void {
    if (!this.connected) return;

    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.bassFilter) this.bassFilter.disconnect();
    if (this.midFilter) this.midFilter.disconnect();
    if (this.trebleFilter) this.trebleFilter.disconnect();
    if (this.gainNode) this.gainNode.disconnect();

    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }

    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

const initialTrack: TrackType = {
  id: "1",
  title: "Ethereal Waves",
  artist: "Psyence Collective",
  albumArt: "/default.png",
  duration: 237,
  src: "./bellywub.mp3",
  album: "Cosmic Journeys",
  upvotes: 42
};

const initialPlaylist: TrackType[] = [
  initialTrack,
  {
    id: "2",
    title: "Neural Drift",
    artist: "Mind Architects",
    albumArt: "/default.png",
    duration: 195,
    src: "./bellywub.mp3",
    album: "Cerebral Constructs",
    upvotes: 38
  },
  {
    id: "3",
    title: "Quantum Fields",
    artist: "Dimension Shift",
    albumArt: "/default.png",
    duration: 312,
    src: "./bellywub.mp3",
    album: "Particle Wave",
    upvotes: 55
  },
  {
    id: "4",
    title: "Astral Journey",
    artist: "Cosmos Navigators",
    albumArt: "/default.png",
    duration: 264,
    src: "./bellywub.mp3",
    album: "Stellar Maps",
    upvotes: 27
  }
];

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,
  isRepeat: false,
  isShuffle: false,
  isLiked: false,
  isExpanded: false,
  showPlaylist: false,
  showEqualizer: false,
  showMobileMenu: false
};

const initialEqSettings: EqualizerSettings = {
  bass: 0,
  mid: 0,
  treble: 0,
  presets: [
    { id: "flat", name: "Flat", values: { bass: 0, mid: 0, treble: 0 } },
    { id: "bass", name: "Bass Boost", values: { bass: 3, mid: -1, treble: 0 } },
    { id: "vocal", name: "Vocal Boost", values: { bass: -2, mid: 3, treble: 1 } },
    { id: "treble", name: "Treble Boost", values: { bass: -1, mid: 1, treble: 3 } },
    { id: "hifi", name: "Hi-Fi", values: { bass: 2, mid: -2, treble: 2 } },
    { id: "telephone", name: "Old Telephone", values: { bass: -12, mid: 6, treble: -4 } }
  ]
};

const musicReducer = (
  state: {
    currentTrack: TrackType | null;
    playlist: TrackType[];
    playbackState: PlaybackState;
    eqSettings: EqualizerSettings;
  },
  action: PlaybackAction
) => {
  switch (action.type) {
    case 'PLAY_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        playbackState: {
          ...state.playbackState,
          isPlaying: true,
          currentTime: 0
        }
      };

    case 'PAUSE':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isPlaying: false
        }
      };

    case 'RESUME':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isPlaying: true
        }
      };

    case 'SET_CURRENT_TIME':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          currentTime: action.payload
        }
      };

    case 'SET_VOLUME':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          volume: action.payload,
          isMuted: action.payload === 0
        }
      };

    case 'TOGGLE_MUTE':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isMuted: !state.playbackState.isMuted
        }
      };

    case 'TOGGLE_REPEAT':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isRepeat: !state.playbackState.isRepeat
        }
      };

    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isShuffle: !state.playbackState.isShuffle
        }
      };

    case 'TOGGLE_LIKE':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isLiked: !state.playbackState.isLiked
        }
      };

    case 'PREV_TRACK': {
      if (!state.currentTrack) return state;

      const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack?.id);
      if (currentIndex === -1) return state;

      const newIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length;
      return {
        ...state,
        currentTrack: state.playlist[newIndex],
        playbackState: {
          ...state.playbackState,
          isPlaying: true,
          currentTime: 0
        }
      };
    }

    case 'NEXT_TRACK': {
      if (!state.currentTrack) return state;

      const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack?.id);
      if (currentIndex === -1) return state;

      const newIndex = (currentIndex + 1) % state.playlist.length;
      return {
        ...state,
        currentTrack: state.playlist[newIndex],
        playbackState: {
          ...state.playbackState,
          isPlaying: true,
          currentTime: 0
        }
      };
    }

    case 'SET_PLAYLIST':
      return {
        ...state,
        playlist: action.payload
      };

    case 'ADD_TO_PLAYLIST':
      return {
        ...state,
        playlist: [...state.playlist, action.payload]
      };

    case 'REMOVE_FROM_PLAYLIST':
      return {
        ...state,
        playlist: state.playlist.filter(track => track.id !== action.payload)
      };

    case 'UPVOTE_TRACK':
      return {
        ...state,
        playlist: state.playlist.map(track =>
          track.id === action.payload
            ? { ...track, upvotes: (track.upvotes || 0) + 1 }
            : track
        )
      };

    case 'SET_EQUALIZER':
      return {
        ...state,
        eqSettings: {
          ...state.eqSettings,
          ...action.payload
        }
      };

    case 'SET_PLAYER_UI':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioInitializedRef = useRef<boolean>(false);

  const [state, dispatch] = useReducer(musicReducer, {
    currentTrack: initialPlaylist[0],
    playlist: initialPlaylist,
    playbackState: initialPlaybackState,
    eqSettings: initialEqSettings
  });

  const { currentTrack, playlist, playbackState, eqSettings } = state;

  // Memoize event handlers to prevent unnecessary re-creation
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audioRef.current.currentTime });
    }
  }, [dispatch]);

  const handleEnded = useCallback(() => {
    if (!audioRef.current) return;

    if (playbackState.isRepeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error("Error repeating track:", error);
        dispatch({ type: 'PAUSE' });
      });
    } else {
      dispatch({ type: 'NEXT_TRACK' });
    }
  }, [playbackState.isRepeat, dispatch]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioProcessorRef.current = new AudioProcessor(audioRef.current);

    const initAudioContext = () => {
      if (!audioInitializedRef.current && audioProcessorRef.current) {
        audioProcessorRef.current.connect();
        audioInitializedRef.current = true;
      }
    };

    const handleUserInteraction = () => {
      initAudioContext();
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    try {
      initAudioContext();
    } catch (e) {

    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
      }
    };
  }, []);


  useEffect(() => {
    if (audioProcessorRef.current && audioInitializedRef.current) {
      audioProcessorRef.current.setEQ({
        bass: eqSettings.bass,
        mid: eqSettings.mid,
        treble: eqSettings.treble
      });
    }
  }, [eqSettings.bass, eqSettings.mid, eqSettings.treble]);


  useEffect(() => {
    if (audioProcessorRef.current && audioInitializedRef.current) {
      const volume = playbackState.isMuted ? 0 : playbackState.volume;
      audioProcessorRef.current.setVolume(volume);
    }

    // Also update native volume control as fallback
    if (audioRef.current) {
      audioRef.current.volume = playbackState.isMuted ? 0 : playbackState.volume;
    }
  }, [playbackState.volume, playbackState.isMuted]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleEnded]);

  // Handle audio element state updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Only update src if it actually changed
    if (audio.src !== currentTrack.src) {
      audio.src = currentTrack.src;
      audio.load(); // Ensure media is loaded before attempting to play
    }

    if (playbackState.isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
          dispatch({ type: 'PAUSE' });
        });
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, playbackState.isPlaying, dispatch]);

  // Update current time if it changes significantly (e.g., from seeking)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only update if the difference is significant to avoid feedback loops
    if (Math.abs(audio.currentTime - playbackState.currentTime) > 1) {
      audio.currentTime = playbackState.currentTime;
    }
  }, [playbackState.currentTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    // Ensure audio processor is initialized on first play
    if (!audioInitializedRef.current && audioProcessorRef.current) {
      audioProcessorRef.current.connect();
      audioInitializedRef.current = true;

      // Apply current settings
      audioProcessorRef.current.setEQ({
        bass: eqSettings.bass,
        mid: eqSettings.mid,
        treble: eqSettings.treble
      });
    }

    if (playbackState.isPlaying) {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'RESUME' });
    }
  };

  const changeTrack = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      dispatch({ type: 'PREV_TRACK' });
    } else {
      dispatch({ type: 'NEXT_TRACK' });
    }
  };

  const selectTrack = (trackId: string) => {
    const track = playlist.find(t => t.id === trackId);
    if (track) {
      dispatch({ type: 'PLAY_TRACK', payload: track });
    }
  };

  const upvoteTrack = (trackId: string) => {
    dispatch({ type: 'UPVOTE_TRACK', payload: trackId });
  };

  const toggleLike = () => {
    dispatch({ type: 'TOGGLE_LIKE' });
  };

  const toggleRepeat = () => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  };

  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const handleSeek = (percent: number) => {
    if (!currentTrack) return;

    const newTime = percent * currentTrack.duration;
    dispatch({ type: 'SET_CURRENT_TIME', payload: newTime });

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const applyEQPreset = (presetId: string) => {
    const preset = eqSettings.presets.find(p => p.id === presetId);
    if (preset) {
      dispatch({
        type: 'SET_EQUALIZER',
        payload: {
          bass: preset.values.bass,
          mid: preset.values.mid,
          treble: preset.values.treble
        }
      });
    }
  };

  const contextValue: MusicContextType = {
    currentTrack,
    playlist,
    playbackState,
    eqSettings,
    audioRef,
    dispatch,
    formatTime,
    togglePlayPause,
    changeTrack,
    selectTrack,
    upvoteTrack,
    toggleLike,
    toggleRepeat,
    toggleShuffle,
    setVolume,
    toggleMute,
    handleSeek,
    applyEQPreset
  };

  return (
    <MusicContext.Provider value={contextValue}>
      <audio ref={audioRef} preload="auto" />
      {children}
    </MusicContext.Provider>
  );
};

export const useMusicPlayer = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicProvider');
  }
  return context;
};