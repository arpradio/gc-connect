'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import Preview from '@/components/Preview';
import { buildMetadata } from '@/lib/metadata';
import { validateForm } from '@/lib/validation';
import { CIP60FormData } from '@/types';
import * as IpfsOnlyHash from 'ipfs-only-hash';
import CIP60Form from "@/components/CIP60Form";
import { uploadToIPFS } from '@/actions/ipfs';

const GAMECHANGER_SDK_URL = "https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc@0.1/dist/browser.min.js";

interface BuildMetadataParams {
  formData: CIP60FormData;
  songIPFS: string;
  coverIPFS: string;
  audioFormat: string;
  minutes: number;
  seconds: number;
}

export default function Page() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fileUploading, setFileUploading] = useState<{
    song: boolean;
    cover: boolean;
  }>({
    song: false,
    cover: false
  });

  const [uploadedCIDs, setUploadedCIDs] = useState<{
    songCID?: string;
    coverCID?: string;
  }>({});

  const [formState, setFormState] = useState<CIP60FormData>({
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
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoverArtChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      setFormState(prev => ({
        ...prev,
        coverArtFile: file
      }));

      handleFileUpload('cover', file);
    }
  };

  const handleFileSelect = async (fileType: 'song' | 'cover', file: File) => {
    setFormState(prev => ({
      ...prev,
      [fileType === 'song' ? 'songFile' : 'coverArtFile']: file
    }));

    handleFileUpload(fileType, file);
  };

  const handleFileUpload = async (fileType: 'song' | 'cover', file: File) => {
    try {
      setFileUploading(prev => ({
        ...prev,
        [fileType]: true
      }));

      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadToIPFS(formData);

      if (result.success && result.cid) {
        setUploadedCIDs(prev => ({
          ...prev,
          [fileType === 'song' ? 'songCID' : 'coverCID']: result.cid
        }));

        console.log(`${fileType} file pinned successfully to ${result.source}. CID: ${result.cid}`);
      } else {
        console.error(`Failed to pin ${fileType} file:`, result.error);
        setError(`Failed to pin ${fileType} file: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error uploading ${fileType} file:`, err);
      setError(`Error uploading ${fileType} file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFileUploading(prev => ({
        ...prev,
        [fileType]: false
      }));
    }
  };

  const handleMint = async () => {
    setLoading(true);
    setError('');

    try {
      const validation = validateForm(formState);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      let songCID = uploadedCIDs.songCID;
      let coverCID = uploadedCIDs.coverCID;

      if (!songCID || !coverCID) {
        alert('Warning: Files have not been pinned to IPFS. They may become inaccessible in the future.');

        try {
          if (!songCID && formState.songFile) {
            const songBuffer = await formState.songFile.arrayBuffer();
            songCID = await IpfsOnlyHash.of(Buffer.from(songBuffer));
            console.log('Generated song CID:', songCID);
          }

          if (!coverCID && formState.coverArtFile) {
            const coverBuffer = await formState.coverArtFile.arrayBuffer();
            coverCID = await IpfsOnlyHash.of(Buffer.from(coverBuffer));
            console.log('Generated cover CID:', coverCID);
          }
        } catch (err) {
          throw new Error('Failed to calculate file CIDs: ' + (err instanceof Error ? err.message : String(err)));
        }
      }

      if (!songCID || !coverCID) {
        throw new Error('Failed to obtain CIDs for files');
      }

      const audio = new Audio();
      const songUrl = URL.createObjectURL(formState.songFile!);
      audio.src = songUrl;

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(songUrl);
          resolve();
        });
        audio.addEventListener('error', reject);
      });

      const totalSeconds = Math.floor(audio.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const metadata = buildMetadata({
        formData: formState,
        songIPFS: songCID,
        coverIPFS: coverCID,
        audioFormat: formState.songFile!.type,
        minutes,
        seconds
      } as BuildMetadataParams);


      const gcscript = {
        type: "script",
        title: "CIP-60 Token Minting",
        description: "A CIP-60 music token minting Script",
        exportAs: "CIP-60",
        return: {
          mode: "last"
        },
        run: {
          dependencies: {
            type: "script",
            run: {
              address: {
                type: "getCurrentAddress"
              },
              addressInfo: {
                type: "macro",
                run: "{getAddressInfo(get('cache.dependencies.address'))}"
              },
              assetName: {
                type: "data",
                value: formState.releaseTitle.replace(/\s+/g, '')
              },
              quantity: {
                type: "data",
                value: formState.quantity.toString()
              },
              currentSlotNumber: {
                type: "getCurrentSlot"
              },
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
            name: "built-CIP60",
            title: "CIP-60 Token Minter",
            tx: {
              ttl: {
                until: "{get('cache.dependencies.deadlineSlotNumber')}"
              },
              mints: [
                {
                  policyId: "{get('cache.dependencies.mintingPolicy.scriptHashHex')}",
                  assets: [
                    {
                      assetName: "{get('cache.dependencies.assetName')}",
                      quantity: "{get('cache.dependencies.quantity')}"
                    }
                  ]
                }
              ],
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
            txs: [
              "{get('cache.build.txHex')}"
            ]
          },
          submit: {
            type: "submitTxs",
            namePattern: "submitted-NFTMint",
            txs: "{get('cache.sign')}"
          },
          finally: {
            type: "script",
            run: {
              txHash: {
                type: "macro",
                run: "{get('cache.build.txHash')}"
              },
              assetName: {
                type: "macro",
                run: "{get('cache.dependencies.assetName')}"
              },
              policyId: {
                type: "macro",
                run: "{get('cache.dependencies.mintingPolicy.scriptHashHex')}"
              },
              canMintUntilSlotNumber: {
                type: "macro",
                run: "{get('cache.dependencies.deadlineSlotNumber')}"
              },
              mintingScript: {
                type: "macro",
                run: "{get('cache.dependencies.mintingPolicy.scriptHex')}"
              }
            }
          }
        }
      };

      const gcUrl = await window.gc.encode.url({
        input: JSON.stringify(gcscript),
        apiVersion: '2',
        network: "mainnet",
        encoding: 'gzip',
      });

      window.open(gcUrl, '_blank', 'width=400,height=800');

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

      <div className="text-center mb-3">
        <h1 className="text-2xl mt-2 font-mono text-white">Submit to ARP Radio!</h1>
        <h2 className="text-xl font-bold text-[#228fa7] mt-4 text-shadow">
          Single Music Token Minting
        </h2>
        <p className="text-white/80 italic text-xs">
          A CIP60-compliant music token minting script for single works.
        </p>

        <hr className='mb-6' />
        <label htmlFor="coverArtFile" className="block text-lg font-bold text-white">
          Cover Art* {formState.coverArtFile?.name && '(Selected)'}
          {fileUploading.cover && ' (Uploading to IPFS...)'}
          {uploadedCIDs.coverCID && ' (Pinned to IPFS)'}
        </label>
        <div className='my-4 rounded bg-black/50 border-[1px] border-neutral-500 w-fit px-6 py-3 mx-auto '>
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
            disabled={fileUploading.cover}
          />
        </div>

        <div className="m-2">
          <label htmlFor="releaseTitle" className="block text-lg font-bold text-white">
            Release Title*
          </label>
          <input
            type="text"
            id="releaseTitle"
            name="releaseTitle"
            value={formState.releaseTitle}
            onChange={handleInputChange}
            required
            className="mt-1 block md:w-full lg:w-[20rem] rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 mx-auto"
          />
        </div>

        <CIP60Form
          formState={formState}
          onFormChange={setFormState}
          onFileSelect={handleFileSelect}
          fileUploading={fileUploading.song}
          filePinned={!!uploadedCIDs.songCID}
        />

        <div className="m-2">
          <label htmlFor="quantity" className="block text-sm font-medium text-white">
            Token Quantity*
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formState.quantity}
            onChange={handleInputChange}
            min="1"
            required
            className="mt-1 block w-24 rounded-md mx-auto border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <Preview formData={formState} />

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={loading || fileUploading.song || fileUploading.cover}
          id="record"
          className={`
            mt-6 w-fit mx-auto py-4 px-8 rounded-lg font-bold text-xl
            flex items-center justify-center gap-2 border-[1px]
            ${(loading || fileUploading.song || fileUploading.cover) ? 'bg-black cursor-not-allowed' : 'bg-black'}
            transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <Image
                src="/album.gif"
                alt="Loading..."
                width={80}
                height={80}
                priority
              />
              <span>Preparing Transaction...</span>
            </>
          ) : fileUploading.song || fileUploading.cover ? (
            <span className="text-white">Uploading to IPFS...</span>
          ) : (
            <span className="text-white">Press Record</span>
          )}
        </button>
      </div>
    </main>
  );
}