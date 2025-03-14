import React, { useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

type MetadataValue = string | number | boolean | object | null;

interface Artist {
  name?: string;
  'name:'?: string;
  [key: string]: unknown;
}

type ArtistData = string | Artist;

interface Song {
  artists?: ArtistData | ArtistData[];
  song_title?: string;
  [key: string]: unknown;
}

interface FileMetadata {
  song?: Song;
  name?: string;
  mediaType?: string;
  [key: string]: unknown;
}

interface MetadataViewerProps {
  data: Record<string, any>;
  className?: string;
  onFieldClick?: (path: string, value: MetadataValue) => void;
}

const MetadataViewer: React.FC<MetadataViewerProps> = ({ 
  data, 
  className = '',
  onFieldClick 
}): React.ReactElement => {
  const extractArtists = useMemo((): Set<string> => {
    const artists: Set<string> = new Set();
    
    // Add artists directly from metadata
    if (data.artist) {
      if (typeof data.artist === 'string') {
        artists.add(data.artist);
      } else if (Array.isArray(data.artist)) {
        data.artist.forEach((artist: unknown) => {
          if (typeof artist === 'string') {
            artists.add(artist);
          }
        });
      }
    }
    
    // Add artists from files
    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file: unknown) => {
        const fileData = file as FileMetadata;
        if (fileData.song?.artists) {
          const artistsData = Array.isArray(fileData.song.artists) 
            ? fileData.song.artists 
            : [fileData.song.artists];
            
          artistsData.forEach((artist: ArtistData) => {
            if (typeof artist === 'string') {
              artists.add(artist);
            } else if (typeof artist === 'object' && artist !== null) {
              const artistObj = artist as Artist;
              const name = artistObj.name || artistObj['name:'];
              if (name && typeof name === 'string') {
                artists.add(name);
              }
            }
          });
        }
      });
    }
    
    return artists;
  }, [data]);

  const renderValue = (value: unknown, path: string = ''): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-amber-300">{value ? 'true' : 'false'}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-300">{value}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.startsWith('http') || value.startsWith('ipfs://')) {
        return (
          <a 
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all inline-block max-w-full overflow-hidden text-ellipsis"
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick?.(path, value);
            }}
          >
            {value}
          </a>
        );
      }
      return <span className="text-green-300 break-all inline-block max-w-full overflow-hidden text-ellipsis">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="pl-4 border-l border-zinc-700">
          {value.map((item, index) => (
            <div key={`${path}-${index}`} className="py-1">
              <div className="flex">
                <span className="text-gray-500 mr-2">[{index}]:</span>
                {renderValue(item, `${path}[${index}]`)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="pl-4 border-l border-zinc-700">
          {Object.entries(value).map(([key, val]) => (
            <div key={`${path}-${key}`} className="py-1">
              <div className="flex flex-col">
                <div className="flex">
                  <span className="text-gray-500 mr-2">{key}:</span>
                  {renderValue(val, path ? `${path}.${key}` : key)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="text-white">{String(value)}</span>;
  };

  return (
    <div className={`${className} overflow-hidden w-full`}>
      <ScrollArea className="h-full max-h-[50vh] w-full">
        <div className="p-3 space-y-2 w-full">
          {Object.entries(data).map(([key, value]) => (
            <div 
              key={key} 
              className="py-2 hover:bg-black/20 rounded px-2 -mx-2 transition-colors w-full"
              onClick={() => onFieldClick?.(key, value)}
            >
              <div className="flex items-start w-full">
                <span className="text-gray-400 font-medium mr-2 flex-shrink-0 break-all">{key}:</span>
                <div className="flex-grow min-w-0 break-all">{renderValue(value, key)}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MetadataViewer;