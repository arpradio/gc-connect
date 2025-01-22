import { ChangeEvent } from 'react';
import { TrackFormData, Artist } from '@/types';
import ArtistForm from './artistForm';
import { PlusCircle, X } from 'lucide-react';

interface TrackFormProps {
  track: TrackFormData;
  onChange: (track: TrackFormData) => void;
  onFileSelect: (file: File) => void;
  trackNumber: number;
}

const initialTrackState: TrackFormData = {
  songTitle: '',
  trackNumber: '1',
  songFile: null,
  isExplicit: false,
  isAIGenerated: false,
  featuredArtists: [],
  authors: [],
  mixEngineer: '',
  masteringEngineer: '',
};

export default function TrackForm({ track, onChange, onFileSelect, trackNumber }: TrackFormProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...track,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({
      ...track,
      [name]: checked
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleAddFeaturedArtist = () => {
    onChange({
      ...track,
      featuredArtists: [
        ...track.featuredArtists,
        { id: `featured-${track.featuredArtists.length}`, name: '', isni: '', links: {} }
      ]
    });
  };

  const handleUpdateFeaturedArtist = (index: number, updatedArtist: Artist) => {
    const newFeaturedArtists = [...track.featuredArtists];
    newFeaturedArtists[index] = updatedArtist;
    onChange({
      ...track,
      featuredArtists: newFeaturedArtists
    });
  };

  const handleRemoveFeaturedArtist = (index: number) => {
    onChange({
      ...track,
      featuredArtists: track.featuredArtists.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Track Title*
          </label>
          <input
            type="text"
            name="songTitle"
            value={track.songTitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Audio File*
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="audio/*"
            required
            className="w-full text-white file:mr-4 file:py-2 file:px-4 
                      file:rounded-full file:border-0 file:text-sm file:font-semibold 
                      file:bg-blue-600 file:text-white hover:file:bg-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            ISRC
          </label>
          <input
            type="text"
            name="isrc"
            value={track.isrc}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            ISWC
          </label>
          <input
            type="text"
            name="iswc"
            value={track.iswc}
            onChange={handleInputChange}
            disabled={track.isAIGenerated}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Producer
          </label>
          <input
            type="text"
            name="producer"
            value={track.producer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Mastering Engineer
          </label>
          <input
            type="text"
            name="mastering_engineer"
            value={track.mastering_engineer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Mix Engineer
          </label>
          <input
            type="text"
            name="mix_engineer"
            value={track.mix_engineer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isAIGenerated"
            checked={track.isAIGenerated}
            onChange={handleCheckboxChange}
            className="rounded border-gray-600 bg-gray-700 text-blue-500"
          />
          <span className="text-white">AI Generated</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isExplicit"
            checked={track.isExplicit}
            onChange={handleCheckboxChange}
            className="rounded border-gray-600 bg-gray-700 text-blue-500"
          />
          <span className="text-white">Explicit Content</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-white">Featured Artists</h4>
          <button
            type="button"
            onClick={handleAddFeaturedArtist}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            <PlusCircle size={16} />
            Add Featured Artist
          </button>
        </div>

        {track.featuredArtists.map((artist, index) => (
          <div key={artist.id} className="relative p-4 bg-gray-800 rounded">
            <button
              type="button"
              onClick={() => handleRemoveFeaturedArtist(index)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-300"
            >
              <X size={20} />
            </button>
            <ArtistForm
              artist={artist}
              onUpdate={(updated) => handleUpdateFeaturedArtist(index, updated)}
              showRemove={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}