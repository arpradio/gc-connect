'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import NetworkSelector, { useNetwork } from '@/components/NetworkSelector';
import { PinataModal } from '@/components/modal';
import AlbumPreview from '@/components/albumView';
import AlbumMetadataForm from '@/components/albumForm';
import { CIP60FormData } from '@/types';
import * as IpfsOnlyHash from 'ipfs-only-hash';
import { PlusCircle, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import TrackForm from '@/components/trackForm';
import { TrackFormData , Artist } from '@/types';

const GAMECHANGER_SDK_URL = "https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc@0.1/dist/browser.min.js";

interface AlbumMetadata {
  artists: Artist[];
  contributingArtists: ContributingArtist[];
  genres: string[];
  copyright: {
    master: string;
    composition: string;
  };
}



const initialTrackState: TrackFormData = {
  songTitle: '',
  trackNumber: '1',  // Add this required field
  songFile: null,
  isAIGenerated: false,
  isExplicit: false,
  featuredArtists: [],
  authors: [],    // Add this required field
  mixEngineer: '',
  masteringEngineer: '',
  producer: '',
  isrc: '',
  iswc: ''
};

export default function AlbumMinter() {
  const { network, setNetwork } = useNetwork();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPinataModal, setShowPinataModal] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<{type: 'song' | 'cover', index: number} | null>(null);
  const [uploadedCIDs, setUploadedCIDs] = useState<{
    [key: string]: { songCID?: string; coverCID?: string; }
  }>({});

  const [releaseTitle, setReleaseTitle] = useState('');
  const [distributor, setDistributor] = useState('');
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [albumMetadata, setAlbumMetadata] = useState<AlbumMetadata>({
    artists: [{ id: 'main', name: '', isni: '', links: {} }],
    contributingArtists: [],
    genres: [],
    copyright: {
      master: '',
      composition: ''
    }
  });
  const [tracks, setTracks] = useState<TrackFormData[]>([{...initialTrackState}]);

  const handleAddTrack = () => setTracks(prev => [...prev, {...initialTrackState}]);

  const handleRemoveTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    setTracks(prev => {
      const newTracks = [...prev];
      if (direction === 'up' && index > 0) {
        [newTracks[index], newTracks[index - 1]] = [newTracks[index - 1], newTracks[index]];
      } else if (direction === 'down' && index < newTracks.length - 1) {
        [newTracks[index], newTracks[index + 1]] = [newTracks[index + 1], newTracks[index]];
      }
      return newTracks;
    });
  };

  const handleTrackUpdate = (index: number, updatedForm: TrackFormData | ((prev: TrackFormData) => TrackFormData)) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[index] = typeof updatedForm === 'function' 
        ? updatedForm(newTracks[index])
        : updatedForm;
      return newTracks;
    });
  };

  const handleCoverArtChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      setCoverArtFile(file);
      handleFileSelect({ type: 'cover', index: 0 }, file);
    }
  };

  const handleFileSelect = (fileInfo: {type: 'song' | 'cover', index: number}, file: File) => {
    if (fileInfo.type === 'song') {
      setTracks(prev => {
        const newTracks = [...prev];
        newTracks[fileInfo.index] = {
          ...newTracks[fileInfo.index],
          songFile: file
        };
        return newTracks;
      });
    } else {
      setCoverArtFile(file);
    }
    
    setSelectedFileType(fileInfo);
    setShowPinataModal(true);
  };

  const handlePinataUploadSuccess = (cid: string) => {
    if (!selectedFileType) return;

    setUploadedCIDs(prev => ({
      ...prev,
      [selectedFileType.index]: {
        ...prev[selectedFileType.index],
        [selectedFileType.type === 'song' ? 'songCID' : 'coverCID']: cid
      }
    }));

    setShowPinataModal(false);
    setSelectedFileType(null);
  };


  const handleMint = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!coverArtFile) throw new Error('Cover art is required');
      if (!releaseTitle) throw new Error('Release title is required');
      if (!albumMetadata.artists[0].name) throw new Error('Main artist is required');
      if (!albumMetadata.copyright.master) throw new Error('Recording copyright is required');
      if (!albumMetadata.copyright.composition) throw new Error('Composition copyright is required');
      if (tracks.length === 0) throw new Error('At least one track is required');

      // Process cover art
      let coverCID = uploadedCIDs[0]?.coverCID;
      if (!coverCID) {
        const coverBuffer = await coverArtFile.arrayBuffer();
        coverCID = await IpfsOnlyHash.of(Buffer.from(coverBuffer));
      }

      // Process tracks
      const processedTracks = await Promise.all(tracks.map(async (track, index) => {
        if (!track.songFile) throw new Error(`Audio file required for track ${index + 1}`);
        if (!track.songTitle) throw new Error(`Title required for track ${index + 1}`);

        let songCID = uploadedCIDs[index]?.songCID;
        if (!songCID) {
          const songBuffer = await track.songFile.arrayBuffer();
          songCID = await IpfsOnlyHash.of(Buffer.from(songBuffer));
        }

        // Get audio duration
        const audio = new Audio();
        const songUrl = URL.createObjectURL(track.songFile);
        audio.src = songUrl;

        const duration = await new Promise<{minutes: number, seconds: number}>((resolve, reject) => {
          audio.addEventListener('loadedmetadata', () => {
            URL.revokeObjectURL(songUrl);
            const totalSeconds = Math.floor(audio.duration);
            resolve({
              minutes: Math.floor(totalSeconds / 60),
              seconds: totalSeconds % 60
            });
          });
          audio.addEventListener('error', reject);
        });

        return {
          ...track,
          songCID,
          duration
        };
      }));
      const metadata = {
        "721": {
          "{get('cache.dependencies.mintingPolicy.scriptHashHex')}": {
            "{get('cache.dependencies.assetName')}": {
              name: `${albumMetadata.artists[0].name} - ${releaseTitle}`,
              image: `ipfs://${coverCID}`,
              music_metadata_version: 3,
              release: {
                release_type: "Album/EP",
                release_title: releaseTitle,
                ...(distributor && { distributor }),
                artists: albumMetadata.artists.map(artist => ({
                  name: artist.name,
                  ...(artist.isni && { isni: artist.isni }),
                  ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                })),
                ...(albumMetadata.contributingArtists.length > 0 && {
                  contributing_artists: albumMetadata.contributingArtists.map(artist => ({
                    name: artist.name,
                    ...(artist.ipn && { ipn: artist.ipn }),
                    ...(artist.ipi && { ipi: artist.ipi }),
                    ...(artist.roles?.length > 0 && { role: artist.roles }),
                    ...(Object.keys(artist.links || {}).length > 0 && { links: artist.links })
                  }))
                }),
                copyright: {
                  master: `℗ ${albumMetadata.copyright.master}`,
                  composition: `© ${albumMetadata.copyright.composition}`
                },
                genres: albumMetadata.genres.filter(Boolean)
              },
              files: processedTracks.map((track, index) => ({
                name: track.songTitle,
                mediaType: track.songFile!.type,
                src: `ipfs://${track.songCID}`,
                song: {
                  song_title: track.songTitle,
                  song_duration: `PT${track.duration.minutes}M${track.duration.seconds}S`,
                  track_number: (index + 1).toString(),
                  ...(track.isExplicit && { explicit: true }),
                  ...(track.isAIGenerated && { ai_generated: true }),
                  
                  ...(track.featuredArtists?.length > 0 && {
                    featured_artists: track.featuredArtists.map(artist => ({
                      name: artist.name,
                      ...(artist.isni && { isni: artist.isni }),
                      ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                    }))
                  }),
      
                  ...(track.producer && { producer: track.producer }),
                  ...(track.mastering_engineer && { mastering_engineer: track.mastering_engineer }),
                  ...(track.mix_engineer && { mix_engineer: track.mix_engineer }),
                  
                  ...(track.isrc && { isrc: track.isrc }),
                  ...(!track.isAIGenerated && track.iswc && { iswc: track.iswc })
                }
              }))
            }
          }
        }
      };
      
      const gcscript = {
        type: "script",
        title: "CIP-60 Album Token Minting",
        description: "CIP-60 compliant album/EP token minting script",
        exportAs: "CIP-60-Album",
        return: { mode: "last" },
        run: {
          dependencies: {
            type: "script",
            run: {
              address: { type: "getCurrentAddress" },
              addressInfo: {
                type: "macro",
                run: "{getAddressInfo(get('cache.dependencies.address'))}"
              },
              assetName: {
                type: "data",
                value: releaseTitle.replace(/\s+/g, '')
              },
              quantity: {
                type: "data",
                value: "1"
              },
              currentSlotNumber: { type: "getCurrentSlot" },
              deadlineSlotNumber: {
                type: "macro",
                run: "{addBigNum(get('cache.dependencies.currentSlotNumber'),'86400')}"
              },
              mintingPolicy: {
                type: "nativeScript",
                script: {
                  all: {
                    issuer: {
                      pubKeyHashHex: "{get('cache.dependencies.addressInfo.paymentKeyHash')}"
                    },
                    timeLock: {
                      slotNumEnd: "{get('cache.dependencies.deadlineSlotNumber')}"
                    }
                  }
                }
              }
            }
          },
          build: {
            type: "buildTx",
            name: "built-CIP60-Album",
            tx: {
              ttl: { until: "{get('cache.dependencies.deadlineSlotNumber')}" },
              mints: [{
                policyId: "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                assets: [{
                  assetName: "{get('cache.dependencies.assetName')}",
                  quantity: "{get('cache.dependencies.quantity')}"
                }]
              }],
              witnesses: {
                nativeScripts: {
                  mintingScript: "{get('cache.dependencies.mintingPolicy.scriptHex')}"
                }
              },
              auxiliaryData: metadata
            }
          },
          sign: {
            type: "signTxs",
            namePattern: "signed-NFTMint",
            detailedPermissions: false,
            txs: ["{get('cache.build.txHex')}"]
          },
          submit: {
            type: "submitTxs",
            namePattern: "submitted-NFTMint",
            txs: "{get('cache.sign')}"
          }
        }
      };
      
      const gcUrl = await window.gc.encode.url({
        input: JSON.stringify(gcscript),
        apiVersion: '2',
        network,
        encoding: 'gzip',
      });
      
      window.open(gcUrl, '_blank', 'width=400,height=600');
      
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Minting error:', err);
      } finally {
        setLoading(false);
      };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = GAMECHANGER_SDK_URL;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <main className="min-h-screen p-4 bg-gradient-to-tl from-[#03215f] via-[#008a7a] to-[#460084]">
      <div className="max-w-4xl mx-auto bg-black/80 p-8 rounded-lg shadow-xl border-2 border-white">
        <Link href="/">
          <div className='fixed text-white hover:bg-blue-600 bg-black p-2 rounded border-white border-[1px]'>
            BACK
          </div>
        </Link>
        
        <div className="text-center mb-6">
          <a href="https://psyencelab.media" target="_blank" rel="noopener noreferrer">
            <Image src="/psyencelab.png" alt="PsyenceLab" width={400} height={100} className="mx-auto border-[1px] rounded-md" priority />
          </a>
          <h1 className="text-2xl mt-2 font-mono text-white">Album/EP Token Minting</h1>
          <NetworkSelector selectedNetwork={network} onNetworkChange={setNetwork} />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-bold text-white mb-2">
            Release Title*
          </label>
          <input
            type="text"
            value={releaseTitle}
            onChange={(e) => setReleaseTitle(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
            placeholder="Enter release title"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-bold text-white mb-2">
            Distributor
          </label>
          <input
            type="text"
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
            placeholder="Enter distributor name (optional)"
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-bold text-white mb-2">
            Cover Art*
          </label>
          <input
            type="file"
            id="coverArtFile"
            name="coverArtFile"
            onChange={handleCoverArtChange}
            accept="image/*"
            required
            className="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
          />
          {coverArtFile && (
            <p className="mt-2 text-sm text-gray-400">
              Selected: {coverArtFile.name}
            </p>
          )}
        </div>

        {tracks.map((song, index) => (
          <div key={index} className="mb-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Track {index + 1}</h2>
              <div className="flex gap-2">
                {index > 0 && (
                  <button onClick={() => handleMoveTrack(index, 'up')} className="p-2 text-blue-400 hover:text-blue-300">
                    <ArrowUp size={20} />
                  </button>
                )}
                {index < tracks.length - 1 && (
                  <button onClick={() => handleMoveTrack(index, 'down')} className="p-2 text-blue-400 hover:text-blue-300">
                    <ArrowDown size={20} />
                  </button>
                )}
                {tracks.length > 1 && (
                  <button onClick={() => handleRemoveTrack(index)} className="p-2 text-red-400 hover:text-red-300">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            
            
            <TrackForm
  track={tracks}
  onChange={(newTrack) => handleTrackUpdate(index, newTrack)}
  onFileSelect={(file) => handleFileSelect({ type: 'song', index }, file)}
  trackNumber={index + 1}  
/>
          </div>
        ))}

        <button
          onClick={handleAddTrack}
          className="w-full py-3 mb-6 flex items-center justify-center gap-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          <PlusCircle size={20} />
          Add Track
        </button>

        {tracks.length > 0 && (
          <AlbumPreview 
            songs={tracks} 
            albumTitle={releaseTitle} 
            coverArtFile={coverArtFile} 
            distributor={distributor}
          />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={loading || tracks.length === 0 || !releaseTitle || !coverArtFile}
          className={`
            mt-6 w-full py-4 px-8 rounded-lg font-bold text-xl
            flex items-center justify-center gap-2 border border-white
            ${loading || tracks.length === 0 || !releaseTitle || !coverArtFile 
              ? 'bg-gray-800 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-500'
            }
            transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <Image src="/album.gif" alt="Loading..." width={80} height={80} priority />
              <span>Preparing Transaction...</span>
            </>
          ) : (
            <span className="text-white">Mint Album</span>
          )}
        </button>

        {showPinataModal && selectedFileType && (
          <PinataModal
            isOpen={showPinataModal}
            onClose={() => {
              setShowPinataModal(false);
              setSelectedFileType(null);
            }}
            file={selectedFileType.type === 'song' 
              ? tracks[selectedFileType.index].songFile 
              : coverArtFile}
            onUploadSuccess={handlePinataUploadSuccess}
          />
        )}
      </div>
    </main>
  );
};

useEffect(() => {
  const script = document.createElement('script');
  script.src = GAMECHANGER_SDK_URL;
  script.async = true;
  document.body.appendChild(script);
  return () => {
    document.body.removeChild(script);
  };
}, []);

return (
  <main className="min-h-screen p-4 bg-gradient-to-tl from-[#03215f] via-[#008a7a] to-[#460084]">
    <div className="max-w-4xl mx-auto bg-black/80 p-8 rounded-lg shadow-xl border-2 border-white">
      <Link href="/">
        <div className='fixed text-white hover:bg-blue-600 bg-black p-2 rounded border-white border-[1px]'>
          BACK
        </div>
      </Link>
      
      <div className="text-center mb-6">
        <a href="https://psyencelab.media" target="_blank" rel="noopener noreferrer">
          <Image src="/psyencelab.png" alt="PsyenceLab" width={400} height={100} className="mx-auto border-[1px] rounded-md" priority />
        </a>
        <h1 className="text-2xl mt-2 font-mono text-white">Album/EP Token Minting</h1>
        <NetworkSelector selectedNetwork={network} onNetworkChange={setNetwork} />
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Release Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Release Title*
              </label>
              <input
                type="text"
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
                placeholder="Enter release title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Distributor
              </label>
              <input
                type="text"
                value={distributor}
                onChange={(e) => setDistributor(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
                placeholder="Enter distributor name (optional)"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Cover Art*
            </label>
            <input
              type="file"
              onChange={handleCoverArtChange}
              accept="image/*"
              required
              className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                        file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
            />
            {coverArtFile && (
              <p className="mt-2 text-sm text-gray-400">
                Selected: {coverArtFile.name}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Album Metadata</h2>
          <AlbumMetadataForm onMetadataChange={setAlbumMetadata} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Tracks</h2>
          
          {tracks.map((track, index) => (
            <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Track {index + 1}</h3>
                <div className="flex gap-2">
                  {index > 0 && (
                    <button 
                      onClick={() => handleMoveTrack(index, 'up')}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <ArrowUp size={20} />
                    </button>
                  )}
                  {index < tracks.length - 1 && (
                    <button 
                      onClick={() => handleMoveTrack(index, 'down')}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <ArrowDown size={20} />
                    </button>
                  )}
                  {tracks.length > 1 && (
                    <button 
                      onClick={() => handleRemoveTrack(index)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              
              <TrackForm
                track={track}
                onChange={(newTrack) => handleTrackUpdate(index, newTrack)}
                onFileSelect={(file) => handleFileSelect({ type: 'song', index }, file)}
              />
            </div>
          ))}

          <button
            onClick={handleAddTrack}
            className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            <PlusCircle size={20} />
            Add Track
          </button>
        </section>

        {tracks.length > 0 && (
          <AlbumPreview 
            tracks={tracks}
            albumTitle={releaseTitle}
            coverArtFile={coverArtFile}
            distributor={distributor}
            albumMetadata={albumMetadata}
          />
        )}

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={loading || tracks.length === 0 || !releaseTitle || !coverArtFile}
          className={`
            w-full py-4 rounded-lg font-bold text-xl
            flex items-center justify-center gap-2 border border-white
            ${loading || tracks.length === 0 || !releaseTitle || !coverArtFile 
              ? 'bg-gray-800 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-500'
            }
            transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <Image src="/album.gif" alt="Loading..." width={80} height={80} priority />
              <span>Preparing Transaction...</span>
            </>
          ) : (
            <span className="text-white">Mint Album</span>
          )}
        </button>
      </div>

      {showPinataModal && selectedFileType && (
        <PinataModal
          isOpen={showPinataModal}
          onClose={() => {
            setShowPinataModal(false);
            setSelectedFileType(null);
          }}
          file={selectedFileType.type === 'song' 
            ? tracks[selectedFileType.index].songFile 
            : coverArtFile}
          onUploadSuccess={handlePinataUploadSuccess}
        />
      )}
    </div>
  </main>
);}