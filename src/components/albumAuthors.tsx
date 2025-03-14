import React from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Author, TrackFormData } from '@/types';

interface AuthorsFormProps {
  track: TrackFormData;
  onChange: (track: TrackFormData) => void;
  trackNumber: number;
}

export default function AuthorsForm({ track, onChange, trackNumber }: AuthorsFormProps) {
  const calculateTotalShare = (authors: Author[]): number => {
    return authors.reduce((total, author) => total + (Number(author.share) || 0), 0);
  };

  const handleAddAuthor = () => {
    onChange({
      ...track,
      authors: [
        ...track.authors,
        { id: `author-${track.authors.length}`, name: '', ipi: '', share: '', role: '' }
      ]
    });
  };

  const handleUpdateAuthor = (index: number, updates: Partial<Author>) => {
    const newAuthors = [...track.authors];
    newAuthors[index] = { ...newAuthors[index], ...updates };
    
    if ('share' in updates) {
      const totalShare = calculateTotalShare(newAuthors);
      if (totalShare > 100) {
        const excess = totalShare - 100;
        const newShare = Number(updates.share) - excess;
        newAuthors[index] = { ...newAuthors[index], share: String(Math.max(0, newShare)) };
      }
    }
    
    onChange({ ...track, authors: newAuthors });
  };

  const handleRemoveAuthor = (index: number) => {
    onChange({
      ...track,
      authors: track.authors.filter((_, i) => i !== index)
    });
  };

  if (track.isAIGenerated) {
    return null;
  }

  return (
    <div className="space-y-4">
        <h4 className="text-lg text-center font-bold font-mono text-white">Authors</h4>
      <div className="flex text-center items-center ">
        
        <button
          type="button"
          onClick={handleAddAuthor}
          className="flex items-center ml-auto gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          <PlusCircle size={16} />
          Add Author
        </button>
      </div>

      {track.authors.map((author, index) => (
        <div key={author.id} className="p-4 pr-8 bg-gray-800 border-gray-600 border rounded space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Author Name"
              value={author.name}
              onChange={(e) => handleUpdateAuthor(index, { name: e.target.value })}
              className="px-3 py-1 bg-gray-700 rounded text-white"
            />
            <input
              type="text"
              placeholder="IPI"
              value={author.ipi || ''}
              onChange={(e) => handleUpdateAuthor(index, { ipi: e.target.value })}
              className="px-3 py-1 bg-gray-700 rounded text-white"
            />
            <input
              type="number"
              placeholder="Share %"
              value={author.share || ''}
              min="0"
              max="100"
              onChange={(e) => handleUpdateAuthor(index, { share: e.target.value })}
              className="px-3 py-1 bg-gray-700 rounded text-white"
            />
            <div className="flex gap-2">
              <select
                value={author.role || ''}
                onChange={(e) => handleUpdateAuthor(index, { role: e.target.value })}
                className="flex-1 px-3 py-1 bg-gray-700 rounded text-white"
              >
                <option value="">Select Role</option>
                <option value="Author/Composer">Author/Composer</option>
                <option value="Author">Author</option>
                <option value="Composer">Composer</option>
                <option value="Arranger">Arranger</option>
                <option value="Adaptor">Adaptor</option>
                <option value="Translator">Translator</option>
                <option value="Publisher">Publisher</option>
                <option value="Sub-Publisher">Sub-Publisher</option>
                <option value="Administrator">Administrator</option>
              </select>
              <button
                type="button"
                onClick={() => handleRemoveAuthor(index)}
                className="p-1 text-red-500 hover:text-red-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {track.authors.length > 0 && (
        <div className={`text-sm text-right ${
          calculateTotalShare(track.authors) === 100 
            ? 'text-green-500' 
            : 'text-yellow-500'
        }`}>
          Total Share: {calculateTotalShare(track.authors)}%
          {calculateTotalShare(track.authors) !== 100 && (
            <p className="text-yellow-500">
              Total share must equal 100%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { AuthorsForm };