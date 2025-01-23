import { useState, useEffect } from 'react';
import { TrackFormData, AlbumMetadata } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle, PauseCircle, Music2 } from 'lucide-react';

interface AlbumPreviewProps {
  tracks: TrackFormData[];
  albumTitle: string;
  coverArtFile: File | null;
  distributor?: string;
  albumMetadata: AlbumMetadata;
}

export default function AlbumPreview({
  tracks,
  albumTitle,
  coverArtFile,
  albumMetadata
}: AlbumPreviewProps) {
  const [coverArtPreview, setCoverArtPreview] = useState<string>('/default.png');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);

  const mainArtist = albumMetadata.artists[0]?.name || 'Artist';

  useEffect(() => {
    if (coverArtFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverArtPreview(e.target?.result as string);
      };
      reader.readAsDataURL(coverArtFile);
    } else {
      setCoverArtPreview('/default.png');
    }
  }, [coverArtFile]);

  useEffect(() => {
    const newAudioElements = tracks.map(track => {
      if (track.songFile) {
        const audio = new Audio(URL.createObjectURL(track.songFile));
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
  }, [tracks]);

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

  const getAllContributors = () => {
    const contributors = new Map<string, Set<string>>();

    tracks.forEach(track => {

      if (track.producer) {
        if (!contributors.has('Producers')) {
          contributors.set('Producers', new Set());
        }
        contributors.get('Producers')?.add(track.producer);
      }

      if (track.masteringEngineer) {
        if (!contributors.has('Mastering')) {
          contributors.set('Mastering', new Set());
        }
        contributors.get('Mastering')?.add(track.masteringEngineer);
      }

      if (track.mixEngineer) {
        if (!contributors.has('Mixing')) {
          contributors.set('Mixing', new Set());
        }
        contributors.get('Mixing')?.add(track.mixEngineer);
      }
    });

    albumMetadata.contributingArtists.forEach(artist => {
      artist.roles?.forEach(role => {
        if (!contributors.has(role)) {
          contributors.set(role, new Set());
        }
        contributors.get(role)?.add(artist.name);
      });
    });

    return contributors;
  };

  return (
    <div className="text-white bg-black/60 rounded-lg p-6 border border-white/10 max-w-2xl mx-auto my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{albumTitle || 'Album Title'}</h2>
        <h3 className="text-xl text-gray-300">{mainArtist}</h3>

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {albumMetadata.genres.map((genre, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-800 rounded-full text-sm"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      <div className="relative w-64 h-64 mx-auto mb-6">
        <Image
          src={coverArtPreview}
          alt="Album Cover"
          fill
          className="object-cover border-[1px] border-neutral-500 rounded-lg shadow-lg"
        />
      </div>

      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
          >
            <button
              onClick={() => handlePlayPause(index)}
              className="text-white hover:text-blue-400 transition-colors"
              disabled={!track.songFile}
            >
              {currentlyPlaying === index ? (
                <PauseCircle size={24} />
              ) : (
                <PlayCircle size={24} />
              )}
            </button>

            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-6">{(index + 1).toString().padStart(2, '0')}</span>
                <div>
                  <h4 className="font-medium">{track.songTitle || `Track ${index + 1}`}</h4>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                    {track.featuredArtists.length > 0 && (
                      <span>feat. {track.featuredArtists.map(artist => artist.name).join(', ')}</span>
                    )}
                    {track.isExplicit && (
                      <span className="px-1.5 py-0.5 bg-red-900/50 rounded text-xs">
                        Explicit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              {track.isrc && (
                <Link
                  href={`https://musicbrainz.org/isrc/${track.isrc}`}
                  target="_blank"
                  className="text-xs hover:text-blue-400"
                >
                  ISRC
                </Link>
              )}
              {!track.isAIGenerated && track.iswc && (
                <Link
                  href={`https://www.ascap.com/repertory#/ace/search/iswc/${track.iswc}`}
                  target="_blank"
                  className="text-xs hover:text-blue-400"
                >
                  ISWC
                </Link>
              )}
              <Music2 size={16} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gray-800 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from(getAllContributors()).map(([role, names]) => (
            <div key={role} className="text-sm">
              <h5 className="font-medium text-gray-400 mb-1">{role}</h5>
              <div className="text-gray-300">
                {Array.from(names).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center mx-auto text-sm text-gray-400 flex justify-between w-fit px-4 ">
        {!albumMetadata.copyright.composition.includes('AI Generated') && (
          <p className="mx-2">© {albumMetadata.copyright.composition}</p>
        )}
        <p className="mx-2"> ℗ {albumMetadata.copyright.master}</p>
      </div>
    </div>
  );
}