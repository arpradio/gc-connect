import { MetadataJson, Artist, ContributingArtist, Author } from '@/types';

export interface ExtractedMetadata {
  title: string;
  artists: Array<{
    name: string;
    links?: Record<string, string>;
  }>;
  genres: string[];
  coverImage: string;
  isExplicit: boolean;
  isAIGenerated: boolean;
  copyright?: {
    master: string;
    composition: string;
  };
  releaseType?: string;
  releaseTitle?: string;
  featuredArtists?: Array<{
    name: string;
    links?: Record<string, string>;
  }>;
  contributingArtists?: Array<{
    name: string;
    roles?: string[];
    links?: Record<string, string>;
  }>;
  authors?: Array<{
    name: string;
    share?: string;
  }>;
  producer?: string;
  mixEngineer?: string;
  masteringEngineer?: string;
  isrc?: string;
  iswc?: string;
}

export const extractMetadata = (metadata: MetadataJson): ExtractedMetadata => {
  // Extract basic info
  const title = metadata?.name ||
    metadata?.release?.release_title ||
    metadata?.files?.[0]?.song?.song_title ||
    'Untitled';

  // Get primary song metadata
  const primarySong = metadata.files?.[0]?.song;

  // Extract artists
  const artists = new Set<Artist>();
  // Release-level artists
  metadata.release?.artists?.forEach(artist => {
    if (artist.name) {
      artists.add({
        id: `artist-${artists.size}`,
        name: artist.name,
        links: Object.fromEntries(
          Object.entries(artist.links || {})
            .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            .filter(([_, v]) => typeof v === 'string')
        )
      });
    }
  });
  // Song-level artists
  primarySong?.artists?.forEach(artist => {
    if (artist.name) {
      artists.add({
        id: `song-artist-${artists.size}`,
        name: artist.name,
        links: artist.links || {}
      });
    }
  });

  // Extract genres
  const genres = new Set<string>();
  [
    ...(metadata.release?.genres || []),
    ...(primarySong?.genres || [])
  ].forEach(genre => genres.add(genre));

  // Extract copyright info
  const copyright = primarySong?.copyright || metadata.release?.copyright || undefined;

  // Extract flags
  const isExplicit = primarySong?.explicit || false;
  const isAIGenerated = primarySong?.ai_generated || false;

  // Extract authors
  const authors = [
    ...(primarySong?.authors || []),
    ...(metadata.release?.authors || [])
  ];

  return {
    title,
    artists: Array.from(artists),
    genres: Array.from(genres),
    coverImage: metadata.image || metadata.files?.[0]?.src || '/default.png',
    isExplicit,
    isAIGenerated,
    copyright,
    releaseType: metadata.release?.release_type,
    releaseTitle: metadata.release?.release_title,
    authors: authors.map(author => ({
      name: author.name,
      share: author.share
    })),
    isrc: primarySong?.isrc,
    iswc: primarySong?.iswc
  };
};