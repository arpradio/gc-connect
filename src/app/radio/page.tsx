'use client';

import React, { FC, ReactElement, useEffect } from 'react';
import Image from 'next/image';
import {
  Heart,
  HeartOff,
  ThumbsUp,
  Share2,
  Clock,
  Music,
  Star,
  Info,
  Disc,
  Tag,
  Calendar,
  BarChart3,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Play,
  Pause,
} from 'lucide-react';
import { useMusicPlayer } from '@/app/contexts';
import { TrackType } from '@/types';

const NowPlaying: FC = (): ReactElement => {
  const {
    currentTrack,
    playlist,
    playbackState,
    audioRef,
    formatTime,
    togglePlayPause,
    toggleLike,
    toggleShuffle,
    toggleRepeat,
    changeTrack,
    selectTrack,
    upvoteTrack,
    dispatch
  } = useMusicPlayer();

  // Load mock data for the radio page tracks
  useEffect(() => {
    // This effect will run only when the component mounts
    const initializeRadioPlaylist = () => {
      const radioTracks: TrackType[] = [
        {
          id: "radio-1",
          title: "Ethereal Waves",
          artist: "Psyence Collective",
          albumArt: "/default.png",
          duration: 237,
          src: "/bellywub.mp3",
          album: "Cosmic Journeys",
          upvotes: 42,
          genre: "Electronic",
          releaseDate: "2024-01-15"
        },
        {
          id: "radio-2",
          title: "Neural Drift",
          artist: "Mind Architects",
          albumArt: "/default.png",
          duration: 195,
          src: "/bellywub.mp3",
          album: "Cerebral Constructs",
          upvotes: 38,
          genre: "Ambient",
          releaseDate: "2024-02-20"
        },
        {
          id: "radio-3",
          title: "Quantum Fields",
          artist: "Dimension Shift",
          albumArt: "/default.png",
          duration: 312,
          src: "/bellywub.mp3",
          album: "Particle Wave",
          upvotes: 55,
          genre: "Downtempo",
          releaseDate: "2024-03-05"
        },
        {
          id: "radio-4",
          title: "Astral Journey",
          artist: "Cosmos Navigators",
          albumArt: "/default.png",
          duration: 264,
          src: "/bellywub.mp3",
          album: "Stellar Maps",
          upvotes: 27,
          genre: "Chillout",
          releaseDate: "2024-03-18"
        }
      ];

      // Update the global playlist in the MusicContext
      dispatch({ type: 'SET_PLAYLIST', payload: radioTracks });

      // Select the first track if no track is currently playing
      if (!currentTrack) {
        dispatch({ type: 'PLAY_TRACK', payload: radioTracks[0] });
      }
    };

    initializeRadioPlaylist();
  }, [dispatch, currentTrack]);

  if (!currentTrack) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400 text-xl">Loading radio tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative w-auto sm:w-80 sm:h-80 rounded-lg overflow-hidden shadow-xl bg-black/30">
              <Image
                src={currentTrack.albumArt}
                alt={`${currentTrack.title} album art`}
                className="object-cover"
                fill
                priority
              />
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 flex-grow">
              <h1 className="text-3xl font-bold text-white mt-2">
                {currentTrack.title}
              </h1>
              <h2 className="text-xl text-zinc-300">{currentTrack.artist}</h2>

              <div className="flex flex-wrap gap-2 mt-2">
                {currentTrack.genre && (
                  <span className="px-3 py-1 bg-blue-900/60 text-blue-200 rounded-full text-xs">
                    {currentTrack.genre}
                  </span>
                )}
                {currentTrack.releaseDate && (
                  <span className="px-3 py-1 bg-purple-900/60 text-purple-200 rounded-full text-xs">
                    {currentTrack.releaseDate}
                  </span>
                )}
              </div>

              <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                  <Music size={16} className="text-amber-400" />
                  <span>Album: {currentTrack.album || "Unknown"}</span>
                </div>

                <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                  <Clock size={16} className="text-amber-400" />
                  <span>Duration: {formatTime(currentTrack.duration)}</span>
                </div>

                {currentTrack.genre && (
                  <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                    <Tag size={16} className="text-amber-400" />
                    <span>Genre: {currentTrack.genre}</span>
                  </div>
                )}

                {currentTrack.releaseDate && (
                  <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                    <Calendar size={16} className="text-amber-400" />
                    <span>Released: {currentTrack.releaseDate}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                  <BarChart3 size={16} className="text-amber-400" />
                  <span>Popularity: {currentTrack.upvotes || 0} upvotes</span>
                </div>

                <div className="flex items-center space-x-2 text-zinc-400 text-sm">
                  <Disc size={16} className="text-amber-400" />
                  <span>Track ID: {currentTrack.id}</span>
                </div>
              </div>



              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={toggleLike}
                  className={`flex items-center space-x-2 px-4 py-2 w-24 text-center rounded-full border ${playbackState.isLiked
                    ? "border-red-500 bg-pink-500/10 text-red-500"
                    : "border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800"
                    }`}
                >
                  {playbackState.isLiked ? (
                    <Heart size={18} />
                  ) : (
                    <HeartOff size={18} />
                  )}
                  <span>{playbackState.isLiked ? "Liked" : "Like"}</span>
                </button>

                <button
                  onClick={() => upvoteTrack(currentTrack.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full border border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800"
                >
                  <ThumbsUp size={18} />
                  <span>Upvote</span>
                </button>

                <button className="flex items-center space-x-2 px-4 py-2 rounded-full border border-zinc-600 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-800">
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-sky-950/40 border border-sky-900/50 rounded-lg flex items-start w-full">
                <Info size={18} className="text-sky-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sky-100 text-sm">
                  <p className="mb-1">Select tracks from the playlist to queue them up.</p>
                  <p>Use the playback controls above or in the bottom player to control music playback.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <div className="bg-sky-950/30 border border-zinc-800 rounded-lg p-4 overflow-hidden h-full">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Music size={18} className="mr-2" />
              Playlist
            </h3>

            <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
              {playlist.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${track.id === currentTrack.id
                    ? "bg-zinc-800/80 border-l-3 border-amber-400 pl-3"
                    : "hover:bg-zinc-800/40"
                    }`}
                  onClick={() => selectTrack(track.id)}
                >
                  <div className="relative w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                    <Image
                      src={track.albumArt}
                      alt={`${track.title} album art`}
                      className="object-cover"
                      fill
                    />
                    {track.id === currentTrack.id && playbackState.isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p
                      className={`font-medium truncate ${track.id === currentTrack.id
                        ? "text-amber-400"
                        : "text-white"
                        }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-zinc-400 text-sm truncate">
                      {track.artist}
                    </p>
                  </div>
                  <div className="text-zinc-500 text-sm ml-3 flex-shrink-0 flex items-center">
                    {track.upvotes !== undefined && (
                      <div className="flex items-center mr-2">
                        <Star size={14} className="text-amber-400 mr-1" />
                        <span>{track.upvotes}</span>
                      </div>
                    )}
                    {formatTime(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RadioPage(): ReactElement {
  return (
    <div className="items-center justify-center">
      <NowPlaying />
    </div>
  );
}