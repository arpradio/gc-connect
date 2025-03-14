import { useState, useEffect } from 'react';
import { CIP60FormData } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle, PauseCircle, Music2 } from 'lucide-react';
import { audioManager } from '../app/utils/audioManager';

interface MultiSongPreviewProps {
  songs: CIP60FormData[];
  albumTitle: string;
  coverArtFile?: File | null;
}

export default function MultiSongPreview({ songs, albumTitle, coverArtFile }: MultiSongPreviewProps) {
  const [coverArtPreview, setCoverArtPreview] = useState<string>('/default.png');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (coverArtFile) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverArtPreview(e.target?.result as string);
      reader.readAsDataURL(coverArtFile);
      return () => reader.abort();
    } else {
      setCoverArtPreview('/default.png');
    }
  }, [coverArtFile]);

  useEffect(() => {
    // Create URLs for the audio files
    const urls = songs.map(song => 
      song.songFile ? URL.createObjectURL(song.songFile) : null
    );
    setAudioUrls(urls.filter(Boolean) as string[]);

    // Clean up URLs on unmount
    return () => {
      urls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [songs]);

  const handlePlayPause = async (index: number) => {
    if (!audioUrls[index]) return;

    if (currentlyPlaying === index) {
      // Already playing this track, pause it
      audioManager.pause();
      setCurrentlyPlaying(null);
    } else {
      try {
        setIsLoading(true);
        
        // Preload and play using audioManager
        const audio = await audioManager.preloadAudio(audioUrls[index]);
        
        audioManager.play(audio, {
          play: () => setCurrentlyPlaying(index),
          pause: () => setCurrentlyPlaying(null),
          stop: () => setCurrentlyPlaying(null)
        }, {
          // Reset startTime to 0 for proper playback
          startTime: 0,
          // Set duration to 30 seconds for preview
          duration: 30,
          onError: (error) => {
            console.error('Error playing track:', error);
            setCurrentlyPlaying(null);
          }
        });
      } catch (error) {
        console.error('Failed to preload audio:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl mt-4 mb-0 font-bold text-center text-white">Preview</h2>
      <div className="w-full max-w-2xl mx-auto bg-black/60 rounded-[10px] p-6 shadow-xl space-y-6 border-[1px] border-color-silver/10">
        <div className="text-center space-y-2">
          <h3 className="text-xl text-white">
            {albumTitle || 'Multiple Track Release'}
          </h3>
        </div>

        <div className="space-y-2">
          <div className="relative max-w-md mx-auto">
            <Image
              src={coverArtPreview}
              alt="Cover Art"
              width={300}
              height={300}
              className="px-2 pb-0 border-[1px] border-neutral-500 shadow-md object-cover m-auto"
            />
          </div>
        </div>

        <div className="space-y-4">
          {songs.map((song, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
              <button
                onClick={() => handlePlayPause(index)}
                className="text-white hover:text-blue-400 transition-colors"
                disabled={!song.songFile || isLoading}
              >
                {currentlyPlaying === index ? (
                  <PauseCircle size={24} />
                ) : (
                  <PlayCircle size={24} className={isLoading ? "opacity-50" : ""} />
                )}
              </button>

              <div className="flex-grow justify-evenly">
                {[song.genre, song.subGenre1, song.subGenre2]
                  .filter(Boolean)
                  .map((genre, i) => (
                    <span key={i} className="px-2 py-0.5 m-1 bg-gray-700 rounded-full text-xs text-gray-300">
                      {genre}
                    </span>
                  ))}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2"></div>
                  <div>
                    <span className="font-medium text-lg">
                      {song.songTitle || `Track ${index + 1}`}
                    </span>
                    {song.isExplicit && (
                      <span className="px-2 ml-2 py-0.5 bg-red-900/50 rounded text-xs text-white">
                        Explicit
                      </span>
                    )}
                    {song.isAIGenerated && (
                      <span className="px-2 py-0.5 ml-1 bg-purple-900/50 rounded text-xs text-white">
                        AI Generated
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-gray-300">
                        {song.artists[0]?.name || 'Artist'}
                      </span>
                    </div>
                  </div>
                </div>

                {song.featuredArtists.length > 0 && (
                  <div className="text-sm text-gray-400 mt-1">
                    feat. {song.featuredArtists.map(artist => artist.name).join(', ')}
                  </div>
                )}

                {song.contributingArtists.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    {song.contributingArtists.map((artist, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-medium">{artist.name}</span>
                        {artist.roles && (
                          <span className="text-gray-500 text-xs">
                            ({artist.roles.join(', ')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs flex font-bold justify-evenly mx-1 text-gray-400 italic">
                  {song.producer && <div className='mx-1'>Producer:<span className='font-normal'> {song.producer}</span></div>}
                  {song.mix_engineer && <div className='mx-1'>Mix: <span className='font-normal'>{song.mix_engineer}</span></div>}
                  {song.mastering_engineer && <div className='mx-1'>Master: <span className='font-normal'>{song.mastering_engineer}</span></div>}
                </div>

                {!song.isAIGenerated && song.authors.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="font-medium">Authors: </span>
                    {song.authors.map((author, i) => (
                      <span key={i}>
                        {author.name}
                        {author.share && ` (${author.share}%)`}
                        {i < song.authors.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <span className="mt-2 text-xs text-gray-500">
                  <div className="mt-2 flex float-end items-center gap-3 text-xs">
                    {song.isAIGenerated ? (
                      <>℗ {song.recordingOwner} | © N/A - AI Generated</>
                    ) : (
                      <>℗ {song.recordingOwner} | © {song.compositionOwner}</>
                    )}
                    {song.isrc && (
                      <Link
                        href={`https://musicbrainz.org/isrc/${song.isrc}`}
                        target="_blank"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        ISRC
                      </Link>
                    )}
                    {!song.isAIGenerated && song.iswc && (
                      <Link
                        href={`https://www.ascap.com/repertory#/ace/search/iswc/${song.iswc}`}
                        target="_blank"
                        className="text-amber-200 hover:text-amber-100"
                      >
                        ISWC
                      </Link>
                    )}
                    <Music2 size={16} className="text-gray-400" />
                  </div>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-800">
          {songs.map((song, index) => (
            song.artists[0]?.links && Object.keys(song.artists[0].links).length > 0 && (
              <div key={index} className="text-center">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  {song.artists[0].name} Links
                </h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(song.artists[0].links).map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-800/50 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}