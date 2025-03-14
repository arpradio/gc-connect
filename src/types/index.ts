import { Dispatch, SetStateAction } from 'react';

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

export interface SearchBarProps {
  filters: SearchFilters;
  onFilterChange: Dispatch<SetStateAction<SearchFilters>>;
}

export interface Copyright {
  master: string;
  composition: string;
}

export interface MusicContextType {
  currentTrack: TrackType | null;
  playlist: TrackType[];
  playbackState: PlaybackState;
  eqSettings: EqualizerSettings;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  dispatch: React.Dispatch<PlaybackAction>;
  formatTime: (seconds: number) => string;
  togglePlayPause: () => void;
  changeTrack: (direction: 'prev' | 'next') => void;
  selectTrack: (trackId: string) => void;
  upvoteTrack: (trackId: string) => void;
  toggleLike: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  handleSeek: (percent: number) => void;
  applyEQPreset: (presetId: string) => void;
}

export interface Asset {
  id: number;
  policy_id: string;
  asset_name: string;
  metadata_version: string;
  metadata_json: MetadataJson;
  created_at: string;
}

export interface MetadataJson {
  artists?: Array<{
    name?: string;
    links?: Record<string, string | string[]>;
  }>;
  name?: string;
  image?: string;
  music_metadata_version: number | string;
  release?: {
    artists?: Array<{
      name?: string;
      links?: Record<string, string | string[]>;
    }>;
    copyright?: {
      master: string;
      composition: string;
    };
    release_title?: string;
    release_type?: string;
    genres?: string[];
    authors?: Array<{
      name: string;
      share?: string;
    }>
  }
  files: Array<{
    mediaType?: string;
    name?: string;
    src?: string;
    song?: {
      song_title?: string;
      artists: Array<{
        name: string;
        links?: Record<string, string>;
      }>;
      featured_artists?: Array<any> | Artist[];
      contributing_artists?: Array<any> | Artist[];
      explicit?: boolean;
      parental_advisory?: boolean;
      ai_generated?: boolean;
      isrc?: string;
      iswc?: string;
      genres?: string[];
      authors?: Array<{
        name: string;
        share?: string;
      }>;
      copyright?: {
        master: string;
        composition: string;
      };
    };
  }>;
}

export interface Author {
  name: string;
  share?: string;
}

export interface Copyright {
  master: string;
  composition: string;
}

export interface Song {
  song_title?: string;
  artists?: Artist[];
  explicit?: boolean;
  isAIGenerated?: boolean;
  genres?: string[];
  authors?: Author[];
  copyright?: Copyright;
}

export interface FileDetails {
  mediaType?: string;
  name?: string;
  src?: string;
  song?: {
    authors?: Array<{
      name: string;
      share?: string;
    }>;
    song_title?: string;
    artists?: Array<{
      name?: string;
      links?: Record<string, string | string[]>;
    }>;
    genres?: string[];
    producer?: string | string[];
    featured_artist?: string;
    contributing_artist?: string[];
    isAIGenerated?: boolean;
    explicit?: boolean;
    parental_advisory?: boolean;
    isrc?: string;
    iswc?: string;
    copyright?: {
      master: string;
      composition: string;
    };
  };
}

export interface Asset {
  id: number;
  policy_id: string;
  asset_name: string;
  metadata_version: string;
  metadata_json: MetadataJson;
  created_at: string;
}

export interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
}

export interface AssetDetailsProps {
  asset: Asset;
  onClose: () => void;
}

interface Object {
  [key: string]: any;
}

export interface Release {
  id: number;
  policy_id: string;
  asset_name: string;
  metadata_version: string;
  metadata_json: {
    name: string;
    image: string;
    music_metadata_version: number;
    release?: {
      artists?: Array<{
        name?: string;
        links?: Record<string, string | string[]>;
      }>;
      copyright?: {
        master: string;
        composition: string;
      };
      release_title?: string;
      release_type?: string;
      genres?: string[];
      authors?: Array<{
        name: string;
        share?: string;
      }>
    };
    files: Array<{
      name: string;
      mediaType: string;
      src: string;
      song: {
        song_title: string;
        song_duration: string;
        track_number: string;
        artists?: Array<{
          name: string;
          isni?: string;
          links?: Record<string, string>;
        }>;
        featured_artists?: Array<{
          name: string;
          isni?: string;
          links?: Record<string, string>;
        }>;
        contributing_artists?: Array<{
          name: string;
          ipn?: string;
          ipi?: string;
          roles?: string[];
          links?: Record<string, string>;
        }>;
        genres?: string[];
        copyright?: {
          master: string;
          composition: string;
        };
        explicit?: boolean;
        parental_advisory?: boolean;
        isAIGenerated?: boolean;
        isrc?: string;
        iswc?: string;
      };
    }>;
  };
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
  }
}

export interface SearchFilters {
  searchTerm: string;
  searchFields: {
    name: boolean;
    title: boolean;
    artist: boolean;
    genre: boolean;
    producer: boolean;
    engineer: boolean;
  };
  genre?: string;
  releaseType?: string;
  policy_limit?: string;
}

export interface TrackFormData {
  songTitle: string;
  trackNumber: string;
  songFile: File | null;
  isAIGenerated: boolean;
  isExplicit: boolean;
  featuredArtists: Artist[];
  authors: Author[];
  producer: string;
  mixEngineer: string;
  masteringEngineer: string;
  isrc?: string;
  iswc?: string;
}

export type TrackType = {
  id: string;
  title: string;
  artist: string;
  albumArt: string | "/default.png";
  duration: number;
  src: string;
  album?: string;
  genre?: string;
  releaseDate?: string;
  upvotes?: number;
};

export type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
  isShuffle: boolean;
  isLiked: boolean;
  isExpanded: boolean;
  showPlaylist: boolean;
  showEqualizer: boolean;
  showMobileMenu: boolean;
};

export type EqualizerSettings = {
  bass: number;
  mid: number;
  treble: number;
  presets: Array<{
    id: string;
    name: string;
    values: {
      bass: number;
      mid: number;
      treble: number;
    };
  }>;
};

export type PlaybackAction =
  | { type: 'PLAY_TRACK'; payload: TrackType }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_LIKE' }
  | { type: 'PREV_TRACK' }
  | { type: 'NEXT_TRACK' }
  | { type: 'SET_PLAYLIST'; payload: TrackType[] }
  | { type: 'ADD_TO_PLAYLIST'; payload: TrackType }
  | { type: 'REMOVE_FROM_PLAYLIST'; payload: string }
  | { type: 'UPVOTE_TRACK'; payload: string }
  | { type: 'SET_EQUALIZER'; payload: Partial<EqualizerSettings> }
  | { type: 'SET_PLAYER_UI'; payload: Partial<PlaybackState> };



export interface ArtistFormProps {
  artist: Artist | ContributingArtist;
  onUpdate: (artist: Artist | ContributingArtist) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export interface PublicKey {
  pubKeyHex: string;
  pubKeyHashHex: string;
  derivationKind: "spend" | "stake";
}

export interface AddressInfo {
  isByron: boolean;
  isReward: boolean;
  isEnterprise: boolean;
  isPointer: boolean;
  isPaymentScript: boolean;
  isStakingScript: boolean;
  paymentScriptHash: string;
  stakingScriptHash: string;
  isScript: boolean;
  kind: string;
  isCardano: boolean;
  isShelley: boolean;
  isBase: boolean;
  isPaymentKey: boolean;
  isStakingKey: boolean;
  paymentKeyHash: string;
  stakingKeyHash: string;
  rewardAddress: string;
  network: "mainnet" | "preprod";
  networkId: number;
  identity: {
    scriptHex: string;
    scriptHash: string;
    scriptRefHex: string;
  };
}

export interface WalletData {
  name: string;
  address: string;
  spendPubKey: PublicKey;
  stakePubKey: PublicKey;
  addressInfo: AddressInfo;
  agreement?: string;
  salt?: string;
}

export interface Signature {
  signature: string;
  key: string;
}

export interface WalletConnectResponse {
  exports: {
    connect: {
      data: WalletData;
      hash: string;
      sign: Signature;
    };
  };
}

export interface TokenAmount {
  policyId: string;
  assetName: string;
  quantity: string;
  decimals: number;
  fingerprint: string;
}

export interface Balance {
  lovelace: string;
  tokens: TokenAmount[];
}

export type WalletError = {
  code: string;
  message: string;
};

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  name: string | null;
  stakeKey: string | null;
  rewardAddress: string | null;
  walletData: WalletData | null;
  error: WalletError | null;
  network: Network;
}

export interface MusicTokenMetadata {
  name: string;
  image?: string;
  music_metadata_version: number;
  release?: {
    release_type?: 'Single' | 'Multiple' | 'Album/EP';
    release_title?: string;
    artists?: Array<{
      name: string;
      isni?: string;
      links?: Record<string, string>;
    }>;
    genres?: string[];
    copyright?: {
      master: string;
      composition: string;
    };
  };
  files: Array<{
    name: string;
    mediaType: string;
    src: string;
    song: {
      song_title: string;
      song_duration?: string;
      track_number?: number | string;
      artists?: Array<{
        name: string;
        isni?: string;
        links?: Record<string, string>;
      }>;
      featured_artists?: Array<{
        name: string;
        isni?: string;
        links?: Record<string, string>;
      }>;
      contributing_artists?: Array<{
        name: string;
        ipn?: string;
        ipi?: string;
        roles?: string[];
        links?: Record<string, string>;
      }>;
      authors?: Array<{
        name: string;
        ipi?: string;
        share?: string;
        role?: string;
      }>;
      genres?: string[];
      copyright?: {
        master: string;
        composition: string;
      };
      explicit?: boolean | string;
      ai_generated?: boolean | string;
      isrc?: string;
      iswc?: string;
      producer?: string;
      mastering_engineer?: string;
      mix_engineer?: string;
    };
  }>;
}



export interface MusicToken {
  id: number;
  policy_id: string;
  asset_name: string;
  metadata_version: string;
  metadata_json: MusicTokenMetadata;
  created_at: string;
  updated_at?: string;
  fingerprint: string;
  quantity: number;
}

export interface MusicTokenResponse {
  data: MusicToken[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  success: boolean;
}

export interface MusicTokenQueryParams {
  search?: string;
  searchFields?: {
    name?: boolean;
    title?: boolean;
    artist?: boolean;
    genre?: boolean;
    producer?: boolean;
    engineer?: boolean;
    policyId?: boolean;
  };
  genre?: string;
  releaseType?: string;
  page?: number;
  limit?: number;
  policy_limit?: 'true' | '';
  address?: string;
}

export interface ProcessedMusicToken {
  assetId: string;
  policyId: string;
  assetName: string;
  displayName: string;
  quantity: number;
  fingerprint: string;
  metadata_json: MusicTokenMetadata;
  parsedMetadata: {
    title: string;
    artists: string[];
    genres: string[];
    duration?: string;
    releaseType?: string;
    coverImage: string;
    isExplicit: boolean;
    isAIGenerated: boolean;
    copyright: {
      master?: string;
      composition?: string;
    };
    isrc?: string;
    iswc?: string;
    producer?: string;
    mixEngineer?: string;
    masteringEngineer?: string;
  };
}

export interface MusicTokenWithAnalytics extends MusicToken {
  playCount?: number;
  likeCount?: number;
  lastPlayed?: string;
  isFavorite?: boolean;
  ownerAddress: string;
  ownerName?: string;
  externalLinks?: {
    explorer?: string;
    marketplace?: string;
    website?: string;
  };
}

export type MusicTokenStore = Map<string, ProcessedMusicToken>;