'use client';

import { PinataModal } from '@/components/modal';
import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import NetworkSelector, { useNetwork } from '@/components/NetworkSelector';
import Preview from '@/components/Preview';
import { buildMetadata } from '@/lib/metadata';
import { validateForm } from '@/lib/validation';
import { CIP60FormData } from '@/types';
import Link from 'next/link';
import * as IpfsOnlyHash from 'ipfs-only-hash';


// Import new consolidated components
import CIP60Form from "@/components/CIP60Form"
import { Alert } from '@/components/ui/alert';

const GAMECHANGER_SDK_URL = "https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc@0.1/dist/browser.min.js";

interface BuildMetadataParams {
  formData: CIP60FormData;
  songIPFS: string;
  coverIPFS: string;
  audioFormat: string;
  minutes: number;
  seconds: number;
}

declare global {
  interface Window {
    gc: {
      encode: {
        url: (params: {
          input: string;
          apiVersion: string;
          network: string;
          encoding: string;
        }) => Promise<string>;
      };
    }
  }
}

export default function Page() {
  const { network, setNetwork } = useNetwork();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPinataModal, setShowPinataModal] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'song' | 'cover' | null>(null);
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
      
      handleFileSelect('cover', file);
    }
  };

  

  const handleFileSelect = (fileType: 'song' | 'cover', file: File) => {
    setFormState(prev => ({
      ...prev,
      [fileType === 'song' ? 'songFile' : 'coverArtFile']: file
    }));
    
    setSelectedFileType(fileType);
    setShowPinataModal(true);
  };

  const handlePinataUploadSuccess = (cid: string) => {
    if (!selectedFileType) return;

    setUploadedCIDs(prev => ({
      ...prev,
      [selectedFileType === 'song' ? 'songCID' : 'coverCID']: cid
    }));

    setShowPinataModal(false);
    setSelectedFileType(null);
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
        network,
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
    <main className="min-h-screen p-4 bg-gradient-to-tl from-[#03215f] via-[#008a7a] to-[#460084]">
      <div className="max-w-4xl mx-auto bg-black/80 p-8 rounded-lg shadow-xl border-2 border-white">
        <Link href="/">
          <div className='fixed text-white hover:bg-blue-600 bg-black p-2 rounded border-white border-[1px]'>
            BACK
          </div>
        </Link>
        
        <div className="text-center mb-3">
          <a href="https://psyencelab.media" target="_blank" rel="noopener noreferrer">
            <Image
              src="/psyencelab.png"
              alt="PsyenceLab"
              width={400}
              height={100}
              className="mx-auto border-[1px] rounded-md"
              priority
            />
          </a>
          <h1 className="text-2xl mt-2 font-mono text-white">Be Your Own Minter!</h1>
          <h2 className="text-xl font-bold text-[#228fa7] mt-4 text-shadow">
            Single Music Token Minting
          </h2>
          <p className="text-white/80 italic text-xs">
            A CIP60-compliant music token minting script for single works.
          </p>
          
          <NetworkSelector
            selectedNetwork={network}
            onNetworkChange={setNetwork}
          />
          <hr className='mb-6'/>
          <label htmlFor="coverArtFile" className="block text-lg font-bold text-white">
            Cover Art* {formState.coverArtFile?.name && '(Selected)'}
          </label>
        <div className='my-4 rounded bg-black/50  border-[1px] border-neutral-500 w-fit px-6 py-3 mx-auto '>
       
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
            className="mt-1 block  md:w-full lg:w-[20rem] rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 mx-auto"
          />
        </div>
<CIP60Form    formState={formState}
          onFormChange={setFormState}
          onFileSelect={handleFileSelect}
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
          disabled={loading}
          id="record"
          className={`
            mt-6 w-fit mx-auto py-4 px-8 rounded-lg font-bold text-xl
            flex items-center justify-center gap-2 border-[1px]
            ${loading ? 'bg-black cursor-not-allowed' : 'bg-black'}
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
          ) : (
            <span className="text-white">Press Record</span>
          )}
        </button>

        {showPinataModal && selectedFileType && (
          <PinataModal
            isOpen={showPinataModal}
            onClose={() => {
              setShowPinataModal(false);
              setSelectedFileType(null);
            }}
            file={selectedFileType === 'song' ? formState.songFile : formState.coverArtFile}
            onUploadSuccess={handlePinataUploadSuccess}
          />
        )}

        <div className="mt-8 text-white/80">
          <h3 className="text-lg font-medium mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Fill in all required fields</li>
            <li>Upload your audio file (WAV/MPEG/MP3)</li>
            <li>Upload cover art (JPEG/PNG, square format recommended)</li>
            <li>Connect your wallet to mint the token</li>
          </ol>
        </div>
      </div>
      </div>
    </main>
  );
}