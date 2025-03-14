"use client"

import React, { useState, useRef, useEffect, type FC, type ReactElement } from "react";
import Image from "next/image";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, List, Sliders, Heart, HeartOff,
  Maximize2, Minimize2, MoreHorizontal
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useMusicPlayer } from "@/app/contexts";
import Dial from "./eq";

const MusicPlayerFooter: FC = (): ReactElement => {
  const {
    currentTrack,
    playlist,
    playbackState,
    eqSettings,
    audioRef,
    formatTime,
    togglePlayPause,
    changeTrack,
    selectTrack,
    toggleLike,
    toggleRepeat,
    toggleShuffle,
    setVolume,
    toggleMute,
    handleSeek,
    applyEQPreset,
    dispatch
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [showEqualizer, setShowEqualizer] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsExpanded(playbackState.isExpanded);
    setShowPlaylist(playbackState.showPlaylist);
    setShowEqualizer(playbackState.showEqualizer);
    setShowMobileMenu(playbackState.showMobileMenu);
  }, [playbackState]);

  const toggleExpand = (): void => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    setShowMobileMenu(false);
    dispatch({
      type: 'SET_PLAYER_UI',
      payload: { isExpanded: newValue, showMobileMenu: false }
    });
  };

  const togglePlaylistView = (): void => {
    const newValue = !showPlaylist;
    setShowPlaylist(newValue);
    setShowEqualizer(false);
    setShowMobileMenu(false);
    dispatch({
      type: 'SET_PLAYER_UI',
      payload: {
        showPlaylist: newValue,
        showEqualizer: false,
        showMobileMenu: false
      }
    });
  };

  const toggleEqualizerView = (): void => {
    const newValue = !showEqualizer;
    setShowEqualizer(newValue);
    setShowPlaylist(false);
    setShowMobileMenu(false);
    dispatch({
      type: 'SET_PLAYER_UI',
      payload: {
        showEqualizer: newValue,
        showPlaylist: false,
        showMobileMenu: false
      }
    });
  };

  const toggleMobileMenuView = (): void => {
    const newValue = !showMobileMenu;
    setShowMobileMenu(newValue);
    dispatch({
      type: 'SET_PLAYER_UI',
      payload: { showMobileMenu: newValue }
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSeekInPlayer = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!progressRef.current || !currentTrack) return;

    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    handleSeek(percent);
  };

  const handleEQChange = (param: 'bass' | 'mid' | 'treble', value: number): void => {
    dispatch({
      type: 'SET_EQUALIZER',
      payload: { [param]: value }
    });
  };

  const renderWaveform = (): ReactElement => {
    if (!currentTrack) return <div></div>;

    const bars = 27;
    const mobileBars = typeof window !== 'undefined' ?
      (window.innerWidth < 640 ? 18 : bars) : bars;

    return (
      <div className="flex items-end h-16 space-x-1 px-4 overflow-hidden">
        {Array.from({ length: mobileBars }).map((_, i) => {
          const heightPercent = Math.sin((i / mobileBars) * Math.PI) * 0.6 + 0.2 + Math.random() * 0.06;
          const isActive = (i / mobileBars) < (playbackState.currentTime / currentTrack.duration);

          return (
            <div
              key={i}
              className={`w-1 sm:w-1.5 rounded-t ${isActive ? 'bg-amber-400' : 'bg-zinc-600'} transition-all duration-150`}
              style={{ height: `${heightPercent * 100}%` }}
            />
          );
        })}
      </div>
    );
  };

  const renderMobileMenu = (): ReactElement | null => {
    if (!showMobileMenu) return null;

    return (
      <div className="absolute bottom-20 right-0 bg-sky-950/95 backdrop-blur-md border border-zinc-700 rounded-t-lg p-3 z-50 w-48">
        <div className="space-y-2">
          <button
            onClick={toggleEqualizerView}
            className={`w-full flex items-center p-2 rounded ${showEqualizer ? 'bg-zinc-700 text-amber-400' : 'hover:bg-zinc-700/50 text-zinc-300'
              }`}
          >
            <Sliders size={18} className="mr-2" /> Equalizer
          </button>
          <button
            onClick={togglePlaylistView}
            className={`w-full flex items-center p-2 rounded ${showPlaylist ? 'bg-zinc-700 text-amber-400' : 'hover:bg-zinc-700/50 text-zinc-300'
              }`}
          >
            <List size={18} className="mr-2" /> Playlist
          </button>
          <button
            onClick={toggleExpand}
            className="w-full flex items-center p-2 rounded text-zinc-300 hover:bg-zinc-700/50"
          >
            {isExpanded ?
              <><Minimize2 size={18} className="mr-2" /> Minimize</> :
              <><Maximize2 size={18} className="mr-2" /> Expand</>
            }
          </button>
        </div>
      </div>
    );
  };

  if (!currentTrack) {
    return <div className="h-20 bg-sky-950/95 backdrop-blur-md border-t border-zinc-700"></div>;
  }

  return (
    <footer className={`fixed bottom-0 left-0 right-0 bg-sky-950/95 backdrop-blur-md border-t border-zinc-700 transition-all duration-300 z-40 ${isExpanded ? 'h-96' : 'h-20'
      }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-full flex flex-col relative">
        {renderMobileMenu()}

        <div className="flex items-center justify-between h-20 w-full">
          <div className="flex items-center space-x-2 sm:space-x-3 w-1/3 sm:w-1/4 min-w-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={currentTrack.albumArt}
                alt={`${currentTrack.title} album art`}
                className="object-cover"
                height={48}
                width={48}
                priority
              />
            </div>
            <div className="truncate min-w-0">
              <h3 className="text-white text-sm sm:text-base font-medium truncate">{currentTrack.title}</h3>
              <p className="text-zinc-400 text-xs sm:text-sm truncate">{currentTrack.artist}</p>
            </div>
            <button
              onClick={toggleLike}
              className={`hidden sm:block ml-1 p-1 rounded-full hover:bg-zinc-700/50 transition-colors ${playbackState.isLiked ? 'text-red-500' : 'text-zinc-400'
                }`}
            >
              {playbackState.isLiked ? <Heart size={18} /> : <HeartOff size={18} />}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 w-2/3 sm:w-2/4 min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={toggleShuffle}
                className={`hidden sm:block p-1 rounded-full hover:bg-zinc-700/50 transition-colors ${playbackState.isShuffle ? 'text-amber-400' : 'text-zinc-400'
                  }`}
              >
                <Shuffle size={16} />
              </button>
              <button
                onClick={() => changeTrack('prev')}
                className="p-1 text-white hover:text-amber-400 transition-colors"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 sm:p-3 bg-amber-400 hover:bg-amber-300 text-sky-950 rounded-full transition-all"
              >
                {playbackState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => changeTrack('next')}
                className="p-1 text-white hover:text-amber-400 transition-colors"
              >
                <SkipForward size={20} />
              </button>
              <button
                onClick={toggleRepeat}
                className={`hidden sm:block p-1 rounded-full hover:bg-zinc-700/50 transition-colors ${playbackState.isRepeat ? 'text-amber-400' : 'text-zinc-400'
                  }`}
              >
                <Repeat size={16} />
              </button>
            </div>

            <div className="w-full max-w-lg flex items-center space-x-2">
              <span className="text-xs text-zinc-400 w-8 text-right hidden xs:block">
                {formatTime(playbackState.currentTime)}
              </span>
              <div
                ref={progressRef}
                className="flex-grow h-1.5 bg-zinc-700 rounded-full cursor-pointer relative group"
                onClick={handleSeekInPlayer}
              >
                <div
                  className="absolute h-full bg-amber-400 rounded-full"
                  style={{ width: `${(playbackState.currentTime / currentTrack.duration) * 100}%` }}
                />
                <div
                  className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `${(playbackState.currentTime / currentTrack.duration) * 100}%`,
                    top: '-3px',
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-8 hidden xs:block">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 ml-1 sm:ml-0 w-auto sm:w-1/4">
            <div className="hidden sm:flex items-center space-x-1">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {playbackState.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playbackState.isMuted ? 0 : playbackState.volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 accent-amber-400"
              />
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={toggleEqualizerView}
                className={`p-1.5 rounded-full hover:bg-zinc-700/50 transition-colors ${showEqualizer ? 'text-amber-400 bg-zinc-700/50' : 'text-zinc-400'
                  }`}
              >
                <Sliders size={18} />
              </button>
              <button
                onClick={togglePlaylistView}
                className={`p-1.5 rounded-full hover:bg-zinc-700/50 transition-colors ${showPlaylist ? 'text-amber-400 bg-zinc-700/50' : 'text-zinc-400'
                  }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={toggleExpand}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-full transition-colors"
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            <button
              onClick={toggleMobileMenuView}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-full transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex-1 pt-2 overflow-hidden">
            {!showPlaylist && !showEqualizer && (
              <div className="flex justify-center items-center h-full">
                {renderWaveform()}
              </div>
            )}

            {showPlaylist && (
              <div className="h-full px-2 py-2">
                <h3 className="text-white font-semibold mb-4">Current Queue</h3>
                <ScrollArea className="h-48 w-full">
                  <div className="space-y-2">
                    {playlist.map((track) => (
                      <div
                        key={track.id}
                        className={`flex items-center p-2 rounded-md hover:bg-zinc-700/30 transition-colors cursor-pointer ${track.id === currentTrack.id ? 'bg-zinc-700/50 border-l-4 border-amber-400 pl-3' : ''
                          }`}
                        onClick={() => {
                          selectTrack(track.id);
                        }}
                      >
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                          <Image
                            src={track.albumArt}
                            alt={`${track.title} album art`}
                            className="object-cover"
                            width={40}
                            height={40}
                          />
                          {track.id === currentTrack.id && playbackState.isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className={`text-sm sm:text-base font-medium truncate ${track.id === currentTrack.id ? 'text-amber-400' : 'text-white'
                            }`}>
                            {track.title}
                          </p>
                          <p className="text-zinc-400 text-xs sm:text-sm truncate">{track.artist}</p>
                        </div>
                        <div className="text-zinc-500 text-xs sm:text-sm ml-2 sm:ml-3">{formatTime(track.duration)}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {showEqualizer && (
              <div className="h-full p-2 sm:p-4 bg-black/20 border-[1px] border-neutral-500/40 rounded-lg">
                <h3 className="text-white font-semibold mb-6">Equalizer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="flex items-center border-[1px] border-white bg-black mx-auto w-fit px-14 py-1 rounded-full justify-center space-x-10">
                    <Dial
                      value={eqSettings.bass}
                      min={-12}
                      max={12}
                      step={1}
                      onChange={(value) => handleEQChange('bass', value)}
                      size={70}
                      label="Bass"
                      valueLabel={`${eqSettings.bass > 0 ? '+' : ''}${eqSettings.bass} dB`}
                    />

                    <Dial
                      value={eqSettings.mid}
                      min={-12}
                      max={12}
                      step={1}
                      onChange={(value) => handleEQChange('mid', value)}
                      size={70}
                      label="Mid"
                      valueLabel={`${eqSettings.mid > 0 ? '+' : ''}${eqSettings.mid} dB`}
                    />

                    <Dial
                      value={eqSettings.treble}
                      min={-12}
                      max={12}
                      step={1}
                      onChange={(value) => handleEQChange('treble', value)}
                      size={70}
                      label="Treble"
                      valueLabel={`${eqSettings.treble > 0 ? '+' : ''}${eqSettings.treble} dB`}
                    />
                  </div>

                  <div className="hidden md:block">
                    <h4 className="text-zinc-300 font-medium mb-3 sm:mb-4 text-sm sm:text-base">Presets</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {eqSettings.presets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyEQPreset(preset.id)}
                          className={`py-2 px-3 sm:px-4 rounded-md text-zinc-300 transition-colors text-xs sm:text-sm ${eqSettings.bass === preset.values.bass &&
                            eqSettings.mid === preset.values.mid &&
                            eqSettings.treble === preset.values.treble
                            ? 'bg-amber-600/40 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

export default MusicPlayerFooter;