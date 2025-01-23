import { useState, useEffect } from 'react';
import { CIP60FormData } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle, PauseCircle } from 'lucide-react';

interface MultiSongPreviewProps {
  songs: CIP60FormData[];
  albumTitle: string;
  coverArtFile?: File | null;
}

export default function MultiSongPreview({ songs, albumTitle, coverArtFile }: MultiSongPreviewProps) {
  const [coverArtPreview, setCoverArtPreview] = useState<string>('/default.png');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);

  useEffect(() => {
    if (coverArtFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverArtPreview(e.target?.result as string);
      };
      reader.readAsDataURL(coverArtFile);

      return () => {
        reader.abort();
      };
    } else {
      setCoverArtPreview('/default.png');
    }
  }, [coverArtFile]);

  useEffect(() => {
    const newAudioElements = songs.map(song => {
      if (song.songFile) {
        const audio = new Audio(URL.createObjectURL(song.songFile));
        audio.addEventListener('ended', () => setCurrentlyPlaying(null));
        return audio;
      }
      return null;
    });

    setAudioElements(newAudioElements.filter(Boolean) as HTMLAudioElement[]);

    return () => {
      newAudioElements.forEach(audio => {
        if (audio) {
          URL.revokeObjectURL(audio.src);
          audio.remove();
        }
      });
    };
  }, [songs]);

  const handlePlayPause = (index: number) => {
    if (currentlyPlaying === index) {
      audioElements[index]?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying !== null && audioElements[currentlyPlaying]) {
        audioElements[currentlyPlaying].pause();
      }
      audioElements[index]?.play();
      setCurrentlyPlaying(index);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-black/60 p-6 rounded-lg border border-white/10">
      <h2 className="text-2xl font-bold text-center mb-4 text-white">
        {albumTitle || 'Multiple Track Release'}
      </h2>
      <div className="  m-auto items-center justify-center  mb-6">
        <div className="block mx-auto w-full">
          <div className=" w-fit mx-auto flex aspect-square">
            <Image
              src={coverArtPreview}
              alt="Cover Art"
              width={300}
              height={300}
              className="object-cover self-center items-center m-auto border-[1px] border-neutral-500 rounded-lg shadow-lg"
            />
          </div>
        </div>

        <div className="md:w-full space-y-4">
          {songs.map((song, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePlayPause(index)}
                  className="text-white hover:text-blue-400 transition-colors"
                  disabled={!song.songFile}
                >
                  {currentlyPlaying === index ? (
                    <PauseCircle size={24} />
                  ) : (
                    <PlayCircle size={24} />
                  )}
                </button>

                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white">
                    {song.songTitle || `Track ${index + 1}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-300">
                      {song.artists[0]?.name || 'Artist'}
                    </span>
                    {song.isExplicit && (
                      <span className="px-2 py-0.5 bg-red-900/50 rounded text-xs text-white">
                        Explicit
                      </span>
                    )}
                    {song.isAIGenerated && (
                      <span className="px-2 py-0.5 bg-purple-900/50 rounded text-xs text-white">
                        AI Generated
                      </span>
                    )}
                  </div>

                  {song.featuredArtists.length > 0 && (
                    <div className="text-sm text-gray-400 mt-1">
                      feat. {song.featuredArtists.map(artist => artist.name).join(', ')}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {[song.genre, song.subGenre1, song.subGenre2]
                      .filter(Boolean)
                      .map((genre, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                  </div>

                  {song.contributingArtists.length > 0 && (
                    <div className="mt-2 text-sm text-gray-400">
                      {song.contributingArtists.map((artist, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span>{artist.name}</span>
                          {artist.roles && (
                            <span className="text-gray-500">
                              ({artist.roles.join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-gray-400">
                    {song.producer && (
                      <div>Producer: {song.producer}</div>
                    )}
                    {song.mix_engineer && (
                      <div>Mix: {song.mix_engineer}</div>
                    )}
                    {song.mastering_engineer && (
                      <div>Master: {song.mastering_engineer}</div>
                    )}
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

                  <div className="mt-2 flex gap-3 text-xs text-gray-400">
                    {song.isrc && (
                      <Link
                        href={`https://musicbrainz.org/isrc/${song.isrc}`}
                        target="_blank"
                        className="hover:text-blue-400"
                      >
                        ISRC: {song.isrc}
                      </Link>
                    )}
                    {!song.isAIGenerated && song.iswc && (
                      <Link
                        href={`https://www.ascap.com/repertory#/ace/search/iswc/${song.iswc}`}
                        target="_blank"
                        className="hover:text-blue-400"
                      >
                        ISWC: {song.iswc}
                      </Link>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {song.isAIGenerated ? (
                      <>℗ {song.recordingOwner} | © N/A - AI Generated</>
                    ) : (
                      <>℗ {song.recordingOwner} | © {song.compositionOwner}</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-800 pt-4">
        {songs.map((song, index) => (
          song.artists[0]?.links && Object.keys(song.artists[0].links).length > 0 && (
            <div key={index} className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                {song.artists[0].name} Links:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(song.artists[0].links).map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 hover:bg-gray-700 transition-colors"
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
  );
}