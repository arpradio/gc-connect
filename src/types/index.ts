export interface Artist {
  id: string;
  name: string;
  isni?: string;
  links: Record<string, string>;
}

export interface ContributingArtist extends Artist {
  ipn?: string;
  ipi?: string;
  roles: string[];
}

export interface Author {
  id: string;
  name: string;
  ipi?: string;
  share?: string;
  role?: string;
}

export interface PinataResponse {
  success: boolean;
  cid?: string;
  error?: string;
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface Copyright {
  master: string;
  composition: string;
}

export interface CIP60FormData {
  releaseTitle: string;
  songTitle: string;
  isAIGenerated: boolean;
  isExplicit: boolean;
  recordingOwner: string;
  compositionOwner: string;
  isrc?: string;
  iswc?: string;
  quantity: number;
  producer: string;
  mastering_engineer: string;
  mix_engineer: string;
  genre: string;
  subGenre1?: string;
  subGenre2?: string;
  songFile: File | null;
  coverArtFile: File | null;
  artists: Artist[];
  featuredArtists: Artist[];
  contributingArtists: ContributingArtist[];
  authors: Author[];
}

export type Network = 'preprod' | 'mainnet';

export interface FormStateUpdate {
  field: keyof CIP60FormData;
  value: string | number | boolean | File | null | Artist[] | ContributingArtist[] | Author[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MetadataBuilderParams {
  formData: CIP60FormData;
  songIPFS: string;
  coverIPFS: string;
  audioFormat: string;
  minutes: number;
  seconds: number;
}

export interface NetworkSelectorProps {
  selectedNetwork: Network;
  onNetworkChange: (network: Network) => void;
}

export interface PreviewProps {
  formData: CIP60FormData;
}

export interface AlbumMetadata {
  artists: Artist[];
  contributingArtists: ContributingArtist[];
  genres: string[];
  copyright: {
    master: string;
    composition: string;
  };
}

export interface TrackFormData {
  songTitle: string;
  trackNumber: string;
  songFile: File | null;
  isExplicit: boolean;
  isAIGenerated: boolean;
  isrc?: string;
  iswc?: string;
  producer?: string;
  mixEngineer?: string;
  masteringEngineer?: string;
  featuredArtists: Artist[];
  authors: Author[];
}

export interface ArtistFormProps {
  artist: Artist | ContributingArtist;
  onUpdate: (artist: Artist | ContributingArtist) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}