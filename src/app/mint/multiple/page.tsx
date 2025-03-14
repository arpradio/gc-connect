"use client"

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import CIP60Form from '@/components/CIP60Form';
import MultiSongPreview from '@/components/multView';
import { CIP60FormData } from '@/types';
import * as IpfsOnlyHash from 'ipfs-only-hash';
import { PlusCircle, Trash2, ArrowDown, ArrowUp } from 'lucide-react';

const GAMECHANGER_SDK_URL = "https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc@0.1/dist/browser.min.js";

const initialFormState: CIP60FormData = {
  releaseTitle: '',
  songTitle: '',
  isAIGenerated: false,
  isExplicit: false,
  recordingOwner: '',
  compositionOwner: '',
  isrc: '',
  iswc: '',
  quantity: 1,
  genre: '',
  subGenre1: '',
  subGenre2: '',
  songFile: null,
  coverArtFile: null,
  artists: [{ id: 'main', name: '', isni: '', links: {} }],
  featuredArtists: [],
  contributingArtists: [],
  authors: [],
  producer: '',
  mastering_engineer: '',
  mix_engineer: ''
};

export default function MultiSongMinter() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPinataModal, setShowPinataModal] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<{ type: 'song' | 'cover', index: number } | null>(null);
  const [uploadedCIDs, setUploadedCIDs] = useState<{
    [key: string]: { songCID?: string; coverCID?: string; }
  }>({});
  const [releaseTitle, setReleaseTitle] = useState('');
  const [songs, setSongs] = useState<CIP60FormData[]>([{ ...initialFormState }]);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);

  const handleAddSong = () => setSongs(prev => [...prev, { ...initialFormState }]);

  const handleRemoveSong = (index: number) => {
    setSongs(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    setSongs(prev => {
      const newSongs = [...prev];
      if (direction === 'up' && index > 0) {
        [newSongs[index], newSongs[index - 1]] = [newSongs[index - 1], newSongs[index]];
      } else if (direction === 'down' && index < newSongs.length - 1) {
        [newSongs[index], newSongs[index + 1]] = [newSongs[index + 1], newSongs[index]];
      }
      return newSongs;
    });
  };

  const handleSongUpdate = (index: number, updatedForm: CIP60FormData | ((prev: CIP60FormData) => CIP60FormData)) => {
    setSongs(prev => {
      const newSongs = [...prev];
      newSongs[index] = typeof updatedForm === 'function'
        ? updatedForm(newSongs[index])
        : updatedForm;
      return newSongs;
    });
  };

  const handleCoverArtChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      setCoverArtFile(file);
      handleFileSelect({ type: 'cover', index: 0 }, file);
    }
  };

  const handleFileSelect = (fileInfo: { type: 'song' | 'cover', index: number }, file: File) => {
    setSongs(prev => {
      const newSongs = [...prev];
      if (fileInfo.type === 'song') {
        newSongs[fileInfo.index] = {
          ...newSongs[fileInfo.index],
          songFile: file
        };
      }
      return newSongs;
    });

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
      let sharedCoverCID = uploadedCIDs[0]?.coverCID;

      if (!sharedCoverCID && coverArtFile) {
        const coverBuffer = await coverArtFile.arrayBuffer();
        sharedCoverCID = await IpfsOnlyHash.of(Buffer.from(coverBuffer));
      }

      if (!sharedCoverCID) {
        throw new Error('Missing cover art CID');
      }

      const processedSongs = await Promise.all(songs.map(async (song, index) => {
        let songCID = uploadedCIDs[index]?.songCID;

        if (!songCID && song.songFile) {
          const songBuffer = await song.songFile.arrayBuffer();
          songCID = await IpfsOnlyHash.of(Buffer.from(songBuffer));
        }

        if (!songCID) {
          throw new Error(`Missing IPFS CID for track ${index + 1}`);
        }

        const audio = new Audio();
        const songUrl = URL.createObjectURL(song.songFile!);
        audio.src = songUrl;

        const duration = await new Promise<{ minutes: number, seconds: number }>((resolve, reject) => {
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
          ...song,
          songCID,
          coverCID: sharedCoverCID,
          duration,
        };
      }));

      const gcscript = {
        type: "script",
        title: "Multiple Song Token Minting",
        description: "CIP-60 compliant music compilation/collection token minting script.  Brought to you by The Psyence Lab LLC.",
        exportAs: "CIP-60-Multi",
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
            name: "built-CIP60-Multi",
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
              auxiliaryData: {
                "721": {
                  "{get('cache.dependencies.mintingPolicy.scriptHashHex')}": {
                    "{get('cache.dependencies.assetName')}": {
                      name: releaseTitle,
                      image: `ipfs://${processedSongs[0].coverCID}`,
                      music_metadata_version: 3,
                      release: {
                        release_type: "Multiple",
                        release_title: releaseTitle,
                      },
                      files: processedSongs.map((song, index) => ({
                        name: song.songTitle,
                        mediaType: song.songFile!.type,
                        src: `ipfs://${song.songCID}`,
                        song: {
                          song_title: song.songTitle,
                          track_number: (index + 1),
                          song_duration: `PT${song.duration.minutes}M${song.duration.seconds}S`,
                          artists: song.artists.map(artist => ({
                            name: artist.name,
                            ...(artist.isni && { isni: artist.isni }),
                            ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                          })),
                          ...(song.featuredArtists.length > 0 && {
                            featured_artists: song.featuredArtists.map(artist => ({
                              name: artist.name,
                              ...(artist.isni && { isni: artist.isni }),
                              ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                            }))
                          }),
                          ...(song.contributingArtists.length > 0 && {
                            contributing_artists: song.contributingArtists.map(artist => ({
                              name: artist.name,
                              ...(artist.ipn && { ipn: artist.ipn }),
                              ...(artist.ipi && { ipi: artist.ipi }),
                              ...(artist.roles?.length > 0 && { role: artist.roles }),
                              ...(Object.keys(artist.links || {}).length > 0 && { links: artist.links })
                            }))
                          }),
                          ...(song.isExplicit && { explicit: `true` }),
                          copyright: {
                            master: `℗ ${song.recordingOwner}`,
                            composition: song.isAIGenerated
                              ? "© N/A - AI Generated"
                              : `© ${song.compositionOwner}`
                          },
                          genres: [song.genre, song.subGenre1, song.subGenre2].filter(Boolean),
                          ...(song.producer && { producer: song.producer }),
                          ...(song.mastering_engineer && {
                            mastering_engineer: song.mastering_engineer
                          }),
                          ...(song.mix_engineer && { mix_engineer: song.mix_engineer }),
                          ...(song.isrc && { isrc: song.isrc }),
                          ...(!song.isAIGenerated && song.iswc && { iswc: song.iswc })
                        }
                      }))
                    }
                  }
                }
              }
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
        network: "mainnet",
        encoding: 'gzip',
      });

      window.open(gcUrl, '_blank', 'width=400,height=600');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Minting error:', err);
    } finally {
      setLoading(false);
    }
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
    <main className="min-h-screen max-w-screen md:max-w-fit mx-auto flex flex-col p-2 sm:p-4 md:p-6 bg-[#0f172a]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>


      <div className="text-center mb-6">

        <h1 className="text-2xl mt-2 font-mono text-white">Submit to ARP Radio!</h1>
        <h2 className="text-xl font-bold text-[#228fa7] mt-4 text-shadow">
          Multiple Song Token Minting
        </h2>
        <p className="text-white/80 italic text-xs">
          A CIP60-compliant music token minting script for works of multiple songs.
        </p>
        <hr className='mb-6' />
      </div>

      <div className="mb-6">
        <label className="block text-lg font-bold text-white mb-2">
          Release Title*
        </label>
        <input
          type="text"
          value={releaseTitle}
          onChange={(e) => setReleaseTitle(e.target.value)}
          className="mt-1 block md:w-full lg:w-[20rem] rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 mx-auto"
          placeholder="Enter release title"
          required
        />
      </div>
      <label htmlFor="coverArtFile" className="block text-lg font-bold text-white">
        Cover Art* {coverArtFile?.name && `(${coverArtFile.name})`}
      </label>
      <div className="mb-6 rounded bg-black/50  border-[1px] border-neutral-500 w-fit px-6 py-3 mx-auto ">

        <input
          type="file"
          id="coverArtFile"
          name="coverArtFile"
          onChange={handleCoverArtChange}
          accept="image/*"
          required
          className="w-full text-white file:mr-4 file:py-2 file:px-4 
                      file:rounded-full file:border-0 file:text-sm file:font-semibold 
                      file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />
      </div>

      {songs.map((song, index) => (
        <div key={index} className="mb-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Track {index + 1}</h2>
            <div className="flex gap-2">
              {index > 0 && (
                <button onClick={() => handleMoveSong(index, 'up')} className="p-2 text-blue-400 hover:text-blue-300">
                  <ArrowUp size={20} />
                </button>
              )}
              {index < songs.length - 1 && (
                <button onClick={() => handleMoveSong(index, 'down')} className="p-2 text-blue-400 hover:text-blue-300">
                  <ArrowDown size={20} />
                </button>
              )}
              {songs.length > 1 && (
                <button onClick={() => handleRemoveSong(index)} className="p-2 text-red-400 hover:text-red-300">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          <CIP60Form
            formState={song}
            onFormChange={(newForm) => handleSongUpdate(index, newForm)}
            onFileSelect={(type, file) => handleFileSelect({ type, index }, file)}
          />
        </div>
      ))}

      <button
        onClick={handleAddSong}
        className="w-full py-3 mb-6 flex items-center justify-center gap-2 bg-blue-600 text-white rounded hover:bg-blue-500"
      >
        <PlusCircle size={20} />
        Add Track
      </button>

      {songs.length > 0 && <MultiSongPreview songs={songs} albumTitle={releaseTitle} coverArtFile={coverArtFile} />}

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={loading || songs.length === 0 || !releaseTitle}
        className={`
            mt-6 w-full py-4 px-8 rounded-lg font-bold text-xl
            flex items-center justify-center gap-2 border border-white
            ${loading || songs.length === 0 || !releaseTitle ? 'bg-gray-800 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}
            transition-colors duration-200
          `}
      >
        {loading ? (
          <>
            <Image src="/album.gif" alt="Loading..." width={80} height={80} priority />
            <span>Preparing Transaction...</span>
          </>
        ) : (
          <span className="text-white">Mint Token</span>
        )}
      </button>

    </main>
  )
}