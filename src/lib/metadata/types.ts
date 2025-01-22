// types.ts

// Base interfaces matching CIP-60 spec
export interface Artist {
  id: string;
  name: string;
  isni?: string;
  links: Record<string, string>;
}

export interface Author {
  id: string;
  name: string;
  ipi?: string;
  share?: string;
  role?: string;
}

export interface ContributingArtist extends Artist {
  ipn?: string;
  ipi?: string;
  roles?: string[];
}

export interface CommonMusicDetails {
  artists: Artist[];
  genres?: string[];
  copyright: {
    master: string;
    composition: string;
  };
  contributing_artists?: ContributingArtist[];
}

export interface SongDetails {
  song_title: string;
  song_duration: string;
  track_number: string;
  featured_artists?: Artist[];
  authors?: Author[];
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

export interface FileDetails {
  name: string;
  mediaType: string;
  src: string;
  song: SongDetails & CommonMusicDetails;
}

// Form interfaces for track-level data management
export interface TrackFormData {
  songTitle: string;
  trackNumber: string;
  songFile: File | null;
  isAIGenerated: boolean;
  isExplicit: boolean;
  featuredArtists: Artist[];
  authors: Author[];
  producer?: string;
  coProducer?: string;
  mixEngineer: string;
  masteringEngineer: string;
  recordingEngineer?: string;
  isrc?: string;
  iswc?: string;
  mood?: string;
  bpm?: string;
  language?: string;
}

// Album-level metadata interface
export interface AlbumMetadata {
  artists: Artist[];
  contributingArtists: ContributingArtist[];
  genres: string[];
  copyright: {
    master: string;
    composition: string;
  };
}

// Main form data interface
export interface CIP60FormData {
  releaseTitle: string;
  releaseType: 'Single' | 'Multiple' | 'Album/EP';
  coverArtFile: File | null;
  distributor?: string;
  albumMetadata: AlbumMetadata;
  tracks: TrackFormData[];
  quantity: number;
}

// Props interfaces
export interface TrackFormProps {
  track: TrackFormData;
  onChange: (track: TrackFormData) => void;
  onFileSelect: (file: File) => void;
  trackNumber: number;
}

export interface AlbumFormProps {
  albumMetadata: AlbumMetadata;
  onMetadataChange: (metadata: AlbumMetadata) => void;
}

export interface FileUploadState {
  [key: string]: {
    songCID?: string;
    coverCID?: string;
  };
}

// Helper function for metadata conversion
export function convertFormToMetadata(
  formData: CIP60FormData,
  songCIDs: Record<number, string>,
  coverCID: string,
  durations: Record<number, { minutes: number; seconds: number }>
): {
  name: string;
  image: string;
  music_metadata_version: number;
  release: {
    release_type: string;
    release_title: string;
    distributor?: string;
  } & CommonMusicDetails;
  files: FileDetails[];
} {
  return {
    name: `${formData.albumMetadata.artists[0].name} - ${formData.releaseTitle}`,
    image: `ipfs://${coverCID}`,
    music_metadata_version: 3,
    release: {
      release_type: formData.releaseType,
      release_title: formData.releaseTitle,
      ...(formData.distributor && { distributor: formData.distributor }),
      ...formData.albumMetadata
    },
    files: formData.tracks.map((track, index) => ({
      name: track.songTitle,
      mediaType: track.songFile?.type || '',
      src: `ipfs://${songCIDs[index]}`,
      song: {
        song_title: track.songTitle,
        song_duration: `PT${durations[index].minutes}M${durations[index].seconds}S`,
        track_number: (index + 1).toString(),
        explicit: track.isExplicit,
        ai_generated: track.isAIGenerated,
        ...formData.albumMetadata,
        ...(track.featuredArtists.length > 0 && { featured_artists: track.featuredArtists }),
        ...(track.authors.length > 0 && { authors: track.authors }),
        producer: track.producer,
        mix_engineer: track.mixEngineer,
        mastering_engineer: track.masteringEngineer,
        ...(track.recordingEngineer && { recording_engineer: track.recordingEngineer }),
        ...(track.isrc && { isrc: track.isrc }),
        ...(!track.isAIGenerated && track.iswc && { iswc: track.iswc }),
        ...(track.mood && { mood: track.mood }),
        ...(track.bpm && { bpm: track.bpm }),
        ...(track.language && { language: track.language })
      }
    }))
  };
}