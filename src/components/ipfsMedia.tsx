import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlayCircle, PauseCircle, Bot, AlertTriangle, Lock, Loader } from 'lucide-react';
import { audioManager } from '../app/utils/audioManager';
import { getIPFSUrl } from '@/actions/ipfs';

// Cache for already processed URLs
const urlCache = new Map<string, string>();

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
  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const retryCountRef = useRef<number>(0);

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

      // Clean up audio playback if this component was playing
      if (isPlaying && audioRef.current) {
        audioManager.pause();
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const processUrl = async () => {
      try {
        // First check cache
        if (urlCache.has(src)) {
          if (isMountedRef.current) {
            setUrl(urlCache.get(src)!);
            setError(false);
          }
          return;
        }

        // For audio, we need to ensure the URL is ready before setting it
        setIsLoading(true);

        const ipfsUrl = await getIPFSUrl(src);
        if (ipfsUrl && isMountedRef.current) {
          // Cache the result
          urlCache.set(src, ipfsUrl);
          setUrl(ipfsUrl);
          setError(false);
        } else if (isMountedRef.current) {
          setError(true);
          if (onError) {
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
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    processUrl();
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

  const handleAudioCanPlay = () => {
    if (isMountedRef.current) {
      setAudioLoaded(true);
      setIsLoading(false);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  const togglePlay = async () => {
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

      // Set a loading timeout in case audio doesn't load
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);

          // Try loading the audio again with a fallback gateway
          if (retryCountRef.current < 2) {
            retryCountRef.current++;
            // Force a reload of the audio element
            if (audioRef.current) {
              const currentSrc = audioRef.current.src;
              audioRef.current.src = '';
              setTimeout(() => {
                if (audioRef.current && isMountedRef.current) {
                  // Try an alternative gateway
                  const newSrc = currentSrc.replace('ipfs.io', 'cloudflare-ipfs.com');
                  audioRef.current.src = newSrc;
                  audioRef.current.load();
                  togglePlay();
                }
              }, 100);
            }
          } else {
            setError(true);
            if (onError) {
              onError();
            }
          }
        }
      }, 10000);

      try {
        abortControllerRef.current = new AbortController();

        // Make sure we have the audio loaded
        if (!audioLoaded && audioRef.current) {
          audioRef.current.load();
        }

        audioManager.play(audioRef.current, {
          play: () => {
            if (isMountedRef.current) {
              setIsPlaying(true);
              setIsLoading(false);

              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
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
          }
        });
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

      // If we haven't retried yet, try an alternative gateway
      if (retryCountRef.current < 2 && audioRef.current) {
        retryCountRef.current++;
        const currentSrc = audioRef.current.src;
        if (currentSrc.includes('ipfs.io')) {
          // Try cloudflare gateway instead
          const newSrc = currentSrc.replace('ipfs.io', 'cloudflare-ipfs.com');
          audioRef.current.src = newSrc;
          audioRef.current.load();
          return;
        }
      }

      setError(true);
      setIsLoading(false);
      if (onError) {
        onError();
      }
    }
  };

  if (!url && !error && !isLoading) return null;

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
              ) : isLoading ? (
                <Loader size={24} className="animate-spin" />
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
              onCanPlay={handleAudioCanPlay}
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
            width={fill ? undefined : 160}
            height={fill ? undefined : 160}
            fill={fill}
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