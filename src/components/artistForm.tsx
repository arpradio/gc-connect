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
    <div className="p-4 bg-gray-800 rounded-lg space-y-3 border-[1px] m-0 border-white/30">
      <div className="flex items-center gap-4 ">
        <input
          type="text"
          placeholder="Artist Name"
          value={artist.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="flex-1 px-3  bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="ISNI"
          value={artist.isni || ''}
          onChange={(e) => handleChange('isni', e.target.value)}
          className="flex-1 px-3  bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:text-red-400 transition-colors"
            aria-label="Remove artist"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Link name"
            value={newLinkName}
            onChange={(e) => setNewLinkName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="px-3  bg-gray-700 rounded text-white w-32 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="url"
            placeholder="URL"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3  bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAddLink}
            disabled={!newLinkName || !newLinkUrl}
            className="px-3  bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            aria-label="Add link"
          >
            <PlusCircle size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(artist.links).map(([name, url]) => (
            <div
              key={name}
              className="flex items-center  gap-2 bg-black/50 px-2 w-fit mt-2 rounded group"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white hover:text-blue-300 mt-2 transition-colors"
              >
                {name}
              </a>
              <button
                onClick={() => handleRemoveLink(name)}
                className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 mt-2 transition-opacity"
                aria-label={`Remove ${name} link`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-amber-200 m-0  text-xs italic">Click the + button for each link you wish to include!</p>
    </div>
  );
}