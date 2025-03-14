import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlayCircle, PauseCircle, Bot, AlertTriangle, Lock } from 'lucide-react';
import { audioManager } from '../app/utils/audioManager';
import { getIPFSUrl } from '@/app/utils/ipfs';

interface IPFSMediaProps {
  src: string;
  type: 'audio' | 'image' | 'video';
  className?: string;
  fill?: boolean;
  alt?: string;
  songTitle?: string;
  isrc?: string;
  iswc?: string;
  isExplicit?: boolean;
  isAIGenerated?: boolean;
  isEncrypted?: boolean;
  onError?: () => void;
  previewDuration?: number;
}

export function IPFSMedia({
  src,
  type,
  className,
  fill,
  alt,
  isrc,
  iswc,
  isExplicit,
  isAIGenerated,
  isEncrypted,
  onError,
  previewDuration = 18
}: IPFSMediaProps) {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const ipfsUrl = getIPFSUrl(src);
      if (ipfsUrl) {
        setUrl(ipfsUrl);
        setError(false);
      } else {
        setError(true);
        if (onError && isMountedRef.current) {
          onError();
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error loading IPFS URL:', err instanceof Error ? err.message : err);
        setError(true);
        if (onError) {
          onError();
        }
      }
    }
  }, [src, onError]);

  useEffect(() => {
    if (type === 'audio' && audioRef.current) {
      const handler = {
        play: () => {
          if (isMountedRef.current) {
            setIsPlaying(true);
          }
        },
        pause: () => {
          if (isMountedRef.current) {
            setIsPlaying(false);
          }
        },
        stop: () => {
          if (isMountedRef.current) {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
          }
        }
      };

      const unregister = audioManager.register(handler);
      return unregister;
    }
  }, [type]);

  const togglePlay = () => {
    if (!audioRef.current || error || isLoading) return;

    if (isPlaying) {
      audioManager.pause();
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    } else {
      if (isMountedRef.current) {
        setIsLoading(true);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
          setError(true);
          if (onError) {
            onError();
          }
        }
      }, 15000);

      try {
        abortControllerRef.current = new AbortController();

        audioManager.play(audioRef.current, {
          play: () => {
            if (isMountedRef.current) {
              setIsPlaying(true);
            }
          },
          pause: () => {
            if (isMountedRef.current) {
              setIsPlaying(false);
            }
          },
          stop: () => {
            if (isMountedRef.current) {
              setIsPlaying(false);
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
            }
          }
        }, {
          startTime: previewDuration > 0 ? 18 : 0, // Start at 18 seconds for previews
          duration: previewDuration > 0 ? previewDuration : undefined, // Set duration for previews only
          onError: (error) => {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            console.error("Error playing audio:", error);
            if (isMountedRef.current) {
              setError(true);
              setIsLoading(false);
              if (onError) onError();
            }
          },
          onComplete: () => {
            if (isMountedRef.current) {
              setIsPlaying(false);
            }
          }
        });

        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } catch (err) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }

        if (isMountedRef.current) {
          console.warn('Error attempting audio playback:', err instanceof Error ? err.message : err);
          setError(true);
          setIsLoading(false);
          if (onError) {
            onError();
          }
        }
      }
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const mediaError = (e.currentTarget as HTMLAudioElement).error;

    const isAbortError = mediaError && (
      mediaError.code === MediaError.MEDIA_ERR_ABORTED ||
      (e.type === 'error' && e.isTrusted === false)
    );

    if (!isAbortError && isMountedRef.current) {
      const errorMessage = mediaError
        ? `Audio error code ${mediaError.code}: ${mediaError.message || 'Unknown error'}`
        : 'Unknown audio error';

      console.warn(errorMessage);
      setError(true);
      setIsLoading(false);
      if (onError) {
        onError();
      }
    }
  };

  if (!url && !error) return null;

  switch (type) {
    case 'audio':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {isExplicit && (
              <div className="text-xs bg-red-700/60 text-gray-200 px-2 w-fit py-1 rounded border border-neutral-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span className="">Explicit</span>
              </div>
            )}
            {isAIGenerated && (
              <div className="text-xs bg-purple-700/60 text-gray-200 px-2 py-1 rounded border border-neutral-400 flex items-center gap-1">
                <Bot size={12} />
                <span>AI Generated</span>
              </div>
            )}
            {isEncrypted && (
              <div className="text-xs bg-gray-700/60 text-gray-200 px-2 py-1 rounded border border-neutral-400 flex items-center gap-1">
                <Lock size={12} />
                <span>ENCRYPTED or non-audio</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 border border-neutral-400 transition-colors">
            <button
              onClick={togglePlay}
              className={`transition-colors ${error ? 'text-gray-500 cursor-not-allowed' : isLoading ? 'text-gray-400 animate-pulse' : 'text-white hover:text-blue-400'}`}
              disabled={error || isLoading}
            >
              {isPlaying ? (
                <PauseCircle size={24} />
              ) : (
                <PlayCircle size={24} />
              )}
            </button>
            <div className="flex-grow">
              <span className="font-medium">{alt || 'Audio Track'}</span>
              {isLoading && <div className="text-xs text-gray-400">Loading...</div>}
              {error && <div className="text-xs text-red-400">Failed to load audio</div>}
            </div>
            <audio
              ref={audioRef}
              src={error ? undefined : url}
              className="hidden"
              preload="metadata"
              onEnded={() => {
                if (isMountedRef.current) {
                  setIsPlaying(false);
                }
              }}
              onError={handleAudioError}
            />
            {(isrc || iswc) && (
              <div className="flex flex-wrap gap-2 px-3">
                {isrc && (
                  <a
                    href={`https://musicbrainz.org/isrc/${isrc}`}
                    target='_blank'
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs bg-blue-700/60 text-gray-200 px-2 py-1 rounded border border-neutral-400">
                      ISRC
                    </div>
                  </a>
                )}
                {iswc && (
                  <a
                    href={`https://www.ascap.com/repertory#/ace/search/iswc/${iswc}`}
                    target='_blank'
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs bg-orange-600/60 text-gray-200 px-2 py-1 rounded border border-neutral-400">
                      ISWC
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case 'video':
      return (
        <video
          src={error ? undefined : url}
          className={className}
          controls
          preload="metadata"
          onError={() => {
            if (isMountedRef.current) {
              setError(true);
              if (onError) {
                onError();
              }
            }
          }}
        />
      );

    case 'image':
      return (
        <div className="relative">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/album.gif"
                alt="Loading..."
                width={fill ? 300 : 160}
                height={fill ? 300 : 160}
                className={className}
                priority
              />
            </div>
          )}
          <Image
            src={error ? '/default.png' : url}
            alt={alt || ''}
            className={`${className} transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            width={fill ? 300 : 160}
            height={fill ? 300 : 160}
            onLoadingComplete={() => {
              if (isMountedRef.current) {
                setIsImageLoading(false);
              }
            }}
            onError={() => {
              if (isMountedRef.current) {
                setError(true);
                setIsImageLoading(false);
                if (onError) {
                  onError();
                }
              }
            }}
          />
        </div>
      );
  }
}