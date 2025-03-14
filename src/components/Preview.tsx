'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CIP60FormData } from '@/types';
import Image from 'next/image';
import { PlayCircle, Music2 } from 'lucide-react';

export interface PreviewProps {
  formData: CIP60FormData;
}

export default function Preview({ formData }: PreviewProps) {
  const [coverArtPreview, setCoverArtPreview] = useState<string>('/default.png');
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    if (formData.coverArtFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverArtPreview(e.target?.result as string);
      };
      reader.readAsDataURL(formData.coverArtFile);
      return () => {
        reader.abort();
      };
    } else {
      setCoverArtPreview('/default.png');
    }
  }, [formData.coverArtFile]);

  useEffect(() => {
    if (formData.songFile) {
      const url = URL.createObjectURL(formData.songFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.songFile]);

  const mainArtist = formData.artists[0];
  const additionalArtists = formData.artists.slice(1);

  return (
    <div className="text-white">
      <h2 className="text-2xl mt-4 mb-0 font-bold text-center text-white">Preview</h2>
      <div className="w-full max-w-2xl mx-auto bg-black/60 rounded-[10px] p-6 shadow-xl space-y-6 border-[1px] border-color-silver/10">

        <div className="text-center space-y-2">
          <h3 className="text-xl text-white">
            {mainArtist?.name && formData.releaseTitle
              ? `${formData.releaseTitle}`
              : 'Artist - Release Title'
            }
          </h3>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex flex-wrap justify-center gap-2">
            {[formData.genre, formData.subGenre1, formData.subGenre2]
              .filter(Boolean)
              .map((genre, index) => (
                <span
                  key={index}
                  className="text-sm bg-gray-800 px-2 py-1 rounded"
                >
                  {genre}
                </span>
              ))}
          </div>
          {formData.isExplicit && (
            <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded">
              Explicit
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative max-w-md mx-auto">
            <Image
              src={coverArtPreview}
              alt="Cover Art Preview"
              width={300}
              height={300}
              className="px-2 pb-0 border-[1px] border-neutral-500 shadow-md object-cover m-auto"
            />
          </div>

        </div>

        <div className="">
          <h4 className="text-lg font-bold text-amber-200 text-center italic">
            {formData.songTitle || 'Song Title'}
          </h4>
          <h6 className="w-fit text-xs mx-auto">by</h6>
          <div className="text-center">
            <h4 className="text-lg font-medium text-white">{mainArtist?.name || 'Artist'}</h4>
            {mainArtist?.isni && (
              <p className="text-sm text-gray-400">ISNI: {mainArtist.isni}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {Object.entries(mainArtist?.links || {}).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>

          {additionalArtists.length > 0 && (
            <div className="text-center m-2 text-white">
              {additionalArtists.map((artist, index) => (
                <div key={index} className="mb-2">
                  <span>{artist.name}</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {Object.entries(artist.links || {}).map(([name, url]) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-gray-800 p-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.featuredArtists.length > 0 && (
            <div className="text-center text-white">
              <p className='text-sm text-gray-400 mt-2 mb-0 italics font-bold'>Featuring:</p>
              {formData.featuredArtists.map((artist, index) => (
                <div key={index} className="mb-2">
                  <span>{artist.name}</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {Object.entries(artist.links || {}).map(([name, url]) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.contributingArtists.length > 0 && (
          <div className="text-center text-sm text-gray-400">
            <p className="text-md italics font-bold">Contributing Artists:</p>
            <div className="">
              {formData.contributingArtists.map((artist, index) => (
                <div key={index}>
                  <div className="  mx-auto text-md font-bold "> <span>{artist.name}</span><span className="text-xs">{artist.roles.length > 0 && ` (${artist.roles.join(', ')})`}</span></div>

                  <div >{Object.entries(artist.links || {}).map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      {name}
                    </a>
                  ))}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-fit text-center text-[.8rem] mx-auto italic text-netural-400">
          {formData.producer && <Link href={`https://musicbrainz.org/search?query=${formData.producer}&type=artist&method=indexed`} target='_blank'><div className="">Producer: {formData.producer}</div></Link>}
          {formData.mastering_engineer && <Link href={`https://musicbrainz.org/search?query=${formData.mastering_engineer}&type=artist&method=indexed`} className="text-purple" target='_blank'><div>Mastering Engineer: {formData.mastering_engineer}</div></Link>}
          {formData.mix_engineer && <Link href={`https://musicbrainz.org/search?query=${formData.mix_engineer}&type=artist&method=indexed`} target='_blank' className="text-purple"><div>Mix Engineer: {formData.mix_engineer}</div></Link>}
        </div>

        {!formData.isAIGenerated && formData.authors.length > 0 && (
          <div className="text-center text-sm text-gray-400">
            <h5 className="font-bold italics mb-2">Authors:</h5>
            <div>
              {formData.authors.map((author, index) => (
                <div key={index} className="text-xs">
                  {author.name}
                  {author.share && ` (${author.share}%)`}
                  {index < formData.authors.length - 1 ? ', ' : ''}
                </div>
              ))}
            </div>
          </div>
        )}



      

        {audioUrl && (
          <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
            <button
              onClick={() => {
                const audio = document.querySelector('audio');
                if (audio?.paused) {
                  audio.play();
                } else {
                  audio?.pause();
                }
              }}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <PlayCircle size={24} />
            </button>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-6">01</span>
                <h4 className="font-medium">{formData.songTitle || 'Track'}</h4>
              </div>
            </div>
            <div className="flex justify-center gap-2 text-xs m-0 text-gray-500">
          {!formData.isAIGenerated && formData.iswc && <Link href={`https://www.ascap.com/repertory#/ace/search/iswc/${formData.iswc}`} className="text-blue-400" target='_blank'><div>ISWC</div></Link>}
          {formData.isrc && <Link className="text-amber-200 hover:text-purple-700" href={`https://musicbrainz.org/isrc/${formData.isrc}`} target='_blank'><div>ISRC</div></Link>}
        </div>
            <Music2 size={16} className="text-gray-400" />
            <audio className="hidden">
              <source src={audioUrl} type={formData.songFile?.type} />
            </audio>
            
          </div>
        )}   

        <div className="text-center text-sm text-gray-400">
          {!formData.isAIGenerated ? (
            <p>© {formData.compositionOwner} | ℗ {formData.recordingOwner}</p>
          ) : (
            <p>© N/A - AI Generated | ℗ {formData.recordingOwner}</p>
          )}
        </div>

      </div>
    </div>
  );
}