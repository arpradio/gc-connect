'use client';

import { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  isni?: string;
  links: Record<string, string>;
}

interface ArtistFormProps {
  artist: Artist;
  onUpdate: (artist: Artist) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function ArtistForm({
  artist,
  onUpdate,
  onRemove,
  showRemove = true
}: ArtistFormProps) {
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleChange = (field: keyof Artist, value: string) => {
    onUpdate({
      ...artist,
      [field]: value
    });
  };
  
  const handleAddLink = () => {
    if (newLinkName && newLinkUrl) {
      const newLinks = {
        ...artist.links,
        [newLinkName]: newLinkUrl
      };

      onUpdate({
        ...artist,
        links: newLinks
      });

      setNewLinkName('');
      setNewLinkUrl('');
    }
  };

  const handleRemoveLink = (linkName: string) => {
    const newLinks = { ...artist.links };
    delete newLinks[linkName];
    onUpdate({
      ...artist,
      links: newLinks
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newLinkName && newLinkUrl) {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-gray-800 rounded-lg space-y-3 border-[1px] border-white/30 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Artist Name"
          value={artist.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        />
        <input
          type="text"
          placeholder="ISNI"
          value={artist.isni || ''}
          onChange={(e) => handleChange('isni', e.target.value)}
          className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
        />
        <div className="block">
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:text-red-400 transition-colors self-center mt-1 sm:mt-0"
            aria-label="Remove artist"
          >
            <X size={18} />
          </button>
        )}
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col border-[1px] p-1  rounded sm:flex-row gap-2 w-full md:border-none">
          <input
            type="text"
            placeholder="Link name"
            value={newLinkName}
            onChange={(e) => setNewLinkName(e.target.value)}
            onKeyUp={handleKeyPress}
            className="w-full sm:w-32 px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
          <div className="flex w-full">
            <input
              type="url"
              placeholder="URL"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyUp={handleKeyPress}
              className="flex-1 px-3 py-2 bg-gray-700 rounded-l text-white border-y border-l border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleAddLink}
              disabled={!newLinkName || !newLinkUrl}
              className="px-3 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
              aria-label="Add link"
            >
              <PlusCircle size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 max-w-full">
          {Object.entries(artist.links).map(([name, url]) => (
            <div
              key={name}
              className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded group max-w-full"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-white hover:text-blue-300 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                title={`${name}: ${url}`}
              >
                {name}
              </a>
              <button
                onClick={() => handleRemoveLink(name)}
                className="text-red-500 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label={`Remove ${name} link`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-amber-200 text-xs italic">Click the + button for each link you wish to include!</p>
    </div>
  );
}