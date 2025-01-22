// AlbumMetadataForm.tsx
import { useState } from 'react';
import { Artist, ContributingArtist } from '@/types';
import ArtistForm from "./artistForm";
import { PlusCircle } from 'lucide-react';

interface AlbumMetadataFormProps {
  onMetadataChange: (metadata: AlbumMetadata) => void;
}

interface AlbumMetadata {
  artists: Artist[];
  contributingArtists: ContributingArtist[];
  genres: string[];
  copyright: {
    master: string;
    composition: string;
  };
}

export default function AlbumMetadataForm({ onMetadataChange }: AlbumMetadataFormProps) {
  const [metadata, setMetadata] = useState<AlbumMetadata>({
    artists: [{ id: 'main', name: '', isni: '', links: {} }],
    contributingArtists: [],
    genres: [],
    copyright: {
      master: '',
      composition: ''
    }
  });

  const handleAddArtist = () => {
    setMetadata(prev => ({
      ...prev,
      artists: [
        ...prev.artists,
        { id: `artist-${prev.artists.length}`, name: '', isni: '', links: {} }
      ]
    }));
    onMetadataChange(metadata);
  };

  const handleUpdateArtist = (index: number, updatedArtist: Artist) => {
    setMetadata(prev => {
      const newArtists = [...prev.artists];
      newArtists[index] = updatedArtist;
      return {
        ...prev,
        artists: newArtists
      };
    });
    onMetadataChange(metadata);
  };

  const handleRemoveArtist = (index: number) => {
    if (index === 0) return; // Don't remove the main artist
    setMetadata(prev => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index)
    }));
    onMetadataChange(metadata);
  };

  const handleAddContributingArtist = () => {
    setMetadata(prev => ({
      ...prev,
      contributingArtists: [
        ...prev.contributingArtists,
        {
          id: `contributing-${prev.contributingArtists.length}`,
          name: '',
          ipn: '',
          ipi: '',
          roles: [],
          links: {}
        }
      ]
    }));
    onMetadataChange(metadata);
  };

  const handleUpdateContributingArtist = (index: number, updates: Partial<ContributingArtist>) => {
    setMetadata(prev => {
      const newArtists = [...prev.contributingArtists];
      newArtists[index] = {
        ...newArtists[index],
        ...updates
      };
      return {
        ...prev,
        contributingArtists: newArtists
      };
    });
    onMetadataChange(metadata);
  };

  const handleRemoveContributingArtist = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      contributingArtists: prev.contributingArtists.filter((_, i) => i !== index)
    }));
    onMetadataChange(metadata);
  };

  const handleGenreChange = (value: string, index: number) => {
    setMetadata(prev => {
      const newGenres = [...prev.genres];
      newGenres[index] = value;
      return {
        ...prev,
        genres: newGenres
      };
    });
    onMetadataChange(metadata);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Album Artists</h3>
        {metadata.artists.map((artist, index) => (
          <ArtistForm
            key={artist.id}
            artist={artist}
            onUpdate={(updated) => handleUpdateArtist(index, updated)}
            onRemove={index > 0 ? () => handleRemoveArtist(index) : undefined}
            showRemove={index > 0}
          />
        ))}
        
        <button
          type="button"
          onClick={handleAddArtist}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          <PlusCircle size={20} />
          Add Artist
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Album Genres</h3>
        <div className="grid grid-cols-3 gap-4">
          <select
            value={metadata.genres[0] || ''}
            onChange={(e) => handleGenreChange(e.target.value, 0)}
            className="bg-gray-700 text-white rounded p-2"
          >
            <option value="">Primary Genre</option>
            <option value="Alternative">Alternative</option>
            <option value="Electronic">Electronic</option>
            {/* Add other genre options */}
          </select>
          
          <input
            type="text"
            placeholder="Sub Genre 1"
            value={metadata.genres[1] || ''}
            onChange={(e) => handleGenreChange(e.target.value, 1)}
            className="bg-gray-700 text-white rounded p-2"
          />
          
          <input
            type="text"
            placeholder="Sub Genre 2"
            value={metadata.genres[2] || ''}
            onChange={(e) => handleGenreChange(e.target.value, 2)}
            className="bg-gray-700 text-white rounded p-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Contributing Artists</h3>
        {metadata.contributingArtists.map((artist, index) => (
          <div key={artist.id} className="p-4 bg-gray-800 rounded-lg space-y-3">
            <ArtistForm
              artist={artist}
              onUpdate={(updated) => handleUpdateContributingArtist(index, updated)}
              onRemove={() => handleRemoveContributingArtist(index)}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="IPN"
                value={artist.ipn || ''}
                onChange={(e) => handleUpdateContributingArtist(index, { ipn: e.target.value })}
                className="flex-1 bg-gray-700 rounded p-2 text-white"
              />
              <input
                type="text"
                placeholder="IPI"
                value={artist.ipi || ''}
                onChange={(e) => handleUpdateContributingArtist(index, { ipi: e.target.value })}
                className="flex-1 bg-gray-700 rounded p-2 text-white"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Add role (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      handleUpdateContributingArtist(index, {
                        roles: [...(artist.roles || []), value]
                      });
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="w-full bg-gray-700 rounded p-2 text-white"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {artist.roles?.map((role, roleIndex) => (
                  <span
                    key={roleIndex}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateContributingArtist(index, {
                          roles: artist.roles?.filter((_, i) => i !== roleIndex)
                        });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={handleAddContributingArtist}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          <PlusCircle size={20} />
          Add Contributing Artist
        </button>
      </div>
    </div>
  );
}