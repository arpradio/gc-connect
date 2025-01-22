import { useState, ChangeEvent } from 'react';
import { PlusCircle, MinusCircle, MoveUp, MoveDown, Music } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  isni?: string;
  links?: Record<string, string>;
}

interface ContributingArtist extends Artist {
  ipn?: string;
  ipi?: string;
  roles?: string[];
}

interface Author {
  id: string;
  name: string;
  ipi?: string;
  share?: string;
  role?: string;
}

interface Song {
  id: string;
  songTitle: string | string[];
  songFile: File | null;
  duration: string;
  trackNumber: number;
  featuredArtists?: Artist[];
  authors?: Author[];
  contributingArtists?: ContributingArtist[];
  artists?: Artist[];
  genres?: string[];
  copyright?: {
    master: string;
    composition: string;
  };
  mood?: string;
  set?: string;
  lyrics?: string;
  special_thanks?: string[];
  bitrate?: string;
  bpm?: string;
  mix_engineer?: string;
  mastering_engineer?: string;
  producer?: string;
  co_producer?: string;
  recording_engineer?: string;
  explicit?: boolean;
  isrc?: string;
  iswc?: string;
  metadata_language?: string;
  country_of_origin?: string;
  language?: string;
  derived_from?: string;
  ai_generated?: boolean;
}

interface AlbumFormState {
  releaseTitle: string;
  coverArtFile: File | null;
  songs: Song[];
  release_type: "Album/EP";
  distributor?: string;
  visual_artist?: string;
  release_date?: string;
  publication_date?: string;
  catalog_number?: string;
  series?: string;
  collection?: string;
  artists?: Artist[];
  genres?: string[];
  copyright?: {
    master: string;
    composition: string;
  };
  contributing_artists?: ContributingArtist[];
}

const createDefaultSong = (index: number): Song => ({
  id: `song-${index}`,
  songTitle: '',
  songFile: null,
  duration: '',
  trackNumber: index + 1,
  featuredArtists: [],
  authors: [],
  contributingArtists: [],
  artists: [],
  genres: [],
  copyright: {
    master: '',
    composition: ''
  },
  explicit: false,
  ai_generated: false
});

const initialFormState: AlbumFormState = {
  releaseTitle: '',
  coverArtFile: null,
  songs: [createDefaultSong(0)],
  release_type: "Album/EP",
  artists: [],
  genres: [],
  copyright: {
    master: '',
    composition: ''
  },
  contributing_artists: []
};

interface AlbumFormProps {
  formState: AlbumFormState;
  onFormChange: (state: AlbumFormState) => void;
  onFileSelect?: (fileType: 'song' | 'cover', file: File, songId?: string) => void;
}

const Alert = ({ children, variant = 'warning' }: { children: React.ReactNode; variant?: 'warning' | 'error' | 'info' }) => {
  const styles = {
    warning: 'bg-yellow-900/50 border-yellow-600',
    error: 'bg-red-900/50 border-red-600',
    info: 'bg-blue-900/50 border-blue-600'
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[variant]}`}>
      {children}
    </div>
  );
};

const CIP60AlbumForm = ({ formState = initialFormState, onFormChange, onFileSelect }: AlbumFormProps) => {
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(0);
  const songs = formState.songs || [createDefaultSong(0)];

  const addSong = () => {
    const newSong = createDefaultSong(songs.length);
    onFormChange({
      ...formState,
      songs: [...songs, newSong]
    });
  };

  const removeSong = (index: number) => {
    const newSongs = songs.filter((_, i) => i !== index)
      .map((song, i) => ({
        ...song,
        trackNumber: i + 1,
        id: `song-${i}`
      }));

    onFormChange({
      ...formState,
      songs: newSongs.length > 0 ? newSongs : [createDefaultSong(0)]
    });

    if (selectedSongIndex >= newSongs.length) {
      setSelectedSongIndex(Math.max(0, newSongs.length - 1));
    }
  };

  const moveSong = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= songs.length) return;

    const newSongs = [...songs];
    const [movedSong] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, movedSong);
    
    onFormChange({
      ...formState,
      songs: newSongs.map((song, i) => ({
        ...song,
        trackNumber: i + 1,
        id: `song-${i}`
      }))
    });
    setSelectedSongIndex(toIndex);
  };

  const handleSongChange = (index: number, field: keyof Song, value: any) => {
    const newSongs = songs.map((song, i) => 
      i === index ? { ...song, [field]: value } : song
    );

    onFormChange({
      ...formState,
      songs: newSongs
    });
  };

  const handleSongFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onFileSelect) {
        onFileSelect('song', file, songs[index].id);
      }
      handleSongChange(index, 'songFile', file);
    }
  };

  const calculateTotalSize = (): number => {
    const metadataEstimate = JSON.stringify(formState).length;
    return Math.round(metadataEstimate / 1024);
  };

  return (
    <div className="space-y-6">
      {/* Album Info */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Album Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white">Album Title</label>
            <input
              type="text"
              value={formState.releaseTitle}
              onChange={(e) => onFormChange({
                ...formState,
                releaseTitle: e.target.value
              })}
              className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white">Cover Art</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  if (onFileSelect) {
                    onFileSelect('cover', file);
                  }
                  onFormChange({
                    ...formState,
                    coverArtFile: file
                  });
                }
              }}
              accept="image/*"
              className="mt-1 w-full text-white"
            />
          </div>
        </div>
      </div>

      {/* Tracks List and Editor */}
      <div className="flex gap-4">
        {/* Track List */}
        <div className="w-64 bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Tracks</h3>
            <button
              onClick={addSong}
              className="p-1 bg-blue-600 rounded hover:bg-blue-500"
              title="Add Track"
            >
              <PlusCircle size={20} />
            </button>
          </div>
          
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                  selectedSongIndex === index ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedSongIndex(index)}
              >
                <Music size={16} />
                <span className="flex-grow truncate">
                  {song.songTitle || `Track ${index + 1}`}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSong(index, index - 1);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Move Up"
                  >
                    <MoveUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSong(index, index + 1);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Move Down"
                  >
                    <MoveDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSong(index);
                    }}
                    className="p-1 hover:bg-red-600 rounded"
                    title="Remove Track"
                  >
                    <MinusCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track Editor */}
        <div className="flex-grow bg-gray-800 p-4 rounded-lg">
          {songs[selectedSongIndex] ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Track {songs[selectedSongIndex].trackNumber} Details
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white">Track Title</label>
                    <input
                      type="text"
                      value={typeof songs[selectedSongIndex].songTitle === 'string' ? songs[selectedSongIndex].songTitle : ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'songTitle', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white">Audio File</label>
                    <input
                      type="file"
                      onChange={(e) => handleSongFileChange(e, selectedSongIndex)}
                      accept="audio/*"
                      className="mt-1 w-full text-white"
                    />
                  </div>
                </div>

                {/* Technical Credits */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white">Producer</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].producer || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'producer', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Co-Producer</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].co_producer || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'co_producer', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Recording Engineer</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].recording_engineer || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'recording_engineer', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Mix Engineer</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].mix_engineer || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'mix_engineer', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Mastering Engineer</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].mastering_engineer || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'mastering_engineer', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">BPM</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].bpm || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'bpm', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>

                {/* Identifiers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white">ISRC</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].isrc || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'isrc', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="XX-XXX-YY-NNNNN"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">ISWC</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].iswc || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'iswc', e.target.value)}
                      disabled={songs[selectedSongIndex].ai_generated}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2 disabled:opacity-50"
                      placeholder="T-XXX.XXX.XXX-X"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Language</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].language || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'language', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="e.g. en-US"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Country of Origin</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].country_of_origin || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'country_of_origin', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="e.g. US"
                    />
                  </div>
                </div>

                {/* Lyrics */}
                <div>
                  <label className="block text-sm font-medium text-white">Lyrics</label>
                  <textarea
                    value={songs[selectedSongIndex].lyrics || ''}
                    onChange={(e) => handleSongChange(selectedSongIndex, 'lyrics', e.target.value)}
                    className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2 h-32 resize-none"
                    placeholder="Enter song lyrics..."
                  />
                </div>

                {/* Additional Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white">Mood</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].mood || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'mood', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="e.g. Energetic, Melancholic"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Set</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].set || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'set', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Derived From</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].derived_from || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'derived_from', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="Original work reference"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white">Bitrate</label>
                    <input
                      type="text"
                      value={songs[selectedSongIndex].bitrate || ''}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'bitrate', e.target.value)}
                      className="mt-1 w-full rounded bg-gray-700 text-white px-3 py-2"
                      placeholder="e.g. 320kbps"
                    />
                  </div>
                </div>

                {/* Special Thanks */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Special Thanks</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {songs[selectedSongIndex].special_thanks?.map((thanks, index) => (
                      <span key={index} className="inline-flex items-center bg-gray-700 rounded px-2 py-1">
                        {thanks}
                        <button
                          type="button"
                          onClick={() => {
                            const newThanks = [...(songs[selectedSongIndex].special_thanks || [])];
                            newThanks.splice(index, 1);
                            handleSongChange(selectedSongIndex, 'special_thanks', newThanks);
                          }}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add special thanks..."
                      className="flex-1 rounded bg-gray-700 text-white px-3 py-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newThanks = [...(songs[selectedSongIndex].special_thanks || []), e.currentTarget.value.trim()];
                          handleSongChange(selectedSongIndex, 'special_thanks', newThanks);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={songs[selectedSongIndex].explicit || false}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'explicit', e.target.checked)}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white">Explicit Content</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={songs[selectedSongIndex].ai_generated || false}
                      onChange={(e) => handleSongChange(selectedSongIndex, 'ai_generated', e.target.checked)}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white">AI Generated</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Add a track to get started
            </div>
          )}
        </div>
      </div>

      {calculateTotalSize() > 10 && (
        <Alert variant="warning">
          <div className="text-yellow-200">
            Estimated metadata size: {calculateTotalSize()}KB
            {calculateTotalSize() > 12 && " - Approaching 13KB limit!"}
          </div>
        </Alert>
      )}
    </div>
  )};

  export default CIP60AlbumForm;