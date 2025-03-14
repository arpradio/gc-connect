import { z } from 'zod';
const ArtistDetailsSchema = z.object({
  name: z.string(),
  isni: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
  links: z.record(z.string(), z.string()).optional()
});

const CopyrightSchema = z.object({
  master: z.string().optional(),
  composition: z.string().optional()
});

const MetadataSchemaV3 = z.object({
  name: z.string(),
  image: z.string(),
  music_metadata_version: z.literal(3),
  release: z.object({
    release_type: z.enum(["Single", "Multiple", "Album/EP"]),
    release_title: z.string(),
    artists: z.array(ArtistDetailsSchema).optional(),
    contributing_artists: z.array(
      z.object({
        name: z.string(),
        ipn: z.string().optional(),
        ipi: z.string().optional(),
        roles: z.array(z.string()).optional(),
        links: z.record(z.string(), z.string()).optional()
      })
    ).optional(),
    genres: z.array(z.string()).optional(),
    copyright: CopyrightSchema.optional(),
  }),
  files: z.array(
    z.object({
      name: z.string(),
      mediaType: z.string(),
      src: z.string(),
      song: z.object({
        song_title: z.union([z.string(), z.array(z.string())]),
        song_duration: z.string().optional(),
        track_number: z.number().optional(),
        artists: z.array(ArtistDetailsSchema).optional(),
        featured_artists: z.array(ArtistDetailsSchema).optional(),
        authors: z.array(
          z.object({
            name: z.string(),
            ipi: z.string().optional(),
            share: z.string().optional()
          })
        ).optional(),
        genres: z.array(z.string()).optional(),
        copyright: CopyrightSchema.optional(),
        explicit: z.boolean().optional(),
        ai_generated: z.boolean().optional(),
        isrc: z.string().optional(),
        iswc: z.string().optional()
      })
    })
  ),
  version: z.number().optional(),
  mediaType: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional()
});

const MetadataSchemaV2 = z.object({
  name: z.string(),
  image: z.union([z.string(), z.array(z.string())]),
  music_metadata_version: z.literal(2),
  release_type: z.enum(["Single", "Multiple"]),
  release: z.object({
    release_title: z.string().optional(),
    copyright: z.string().optional(),
    distributor: z.string().optional()
  }),
  files: z.array(
    z.object({
      name: z.string(),
      mediaType: z.string(),
      src: z.union([z.string(), z.array(z.string())]),
      song: z.object({
        artists: z.array(ArtistDetailsSchema).optional(),
        song_title: z.union([z.string(), z.array(z.string())]).optional(),
        song_duration: z.string().optional(),
        track_number: z.number().optional(),
        genres: z.array(z.string()).optional(),
        copyright: z.string().optional(),
        explicit: z.boolean().optional()
      })
    })
  ),
  version: z.number().optional(),
  mediaType: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional()
});

const MetadataSchemaV1 = z.object({
  name: z.string(),
  image: z.union([z.string(), z.array(z.string())]),
  music_metadata_version: z.literal(1),
  release_type: z.enum(["Single", "Multiple"]),
  artists: z.array(ArtistDetailsSchema).optional(),
  album_title: z.string().optional(),
  song_title: z.union([z.string(), z.array(z.string())]).optional(),
  song_duration: z.string().optional(),
  track_number: z.number().optional(),
  genres: z.array(z.string()).optional(),
  copyright: z.string().optional(),
  files: z.array(
    z.object({
      name: z.string(),
      mediaType: z.string(),
      src: z.union([z.string(), z.array(z.string())]),
      artists: z.array(ArtistDetailsSchema).optional(),
      song_title: z.union([z.string(), z.array(z.string())]).optional(),
      song_duration: z.string().optional(),
      track_number: z.number().optional()
    })
  ),
  version: z.number().optional(),
  mediaType: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional()
});

class CIP60MetadataParser {
  /**
   * Determine and validate the metadata version
   * @param metadata Raw metadata object
   * @returns Validated and normalized metadata
   */
  static parse(metadata: any): any {

    if (metadata['721']) {
      const policyKeys = Object.keys(metadata['721']);
      if (policyKeys.length === 1) {
        const assetKeys = Object.keys(metadata['721'][policyKeys[0]]);
        if (assetKeys.length === 1) {
          metadata = metadata['721'][policyKeys[0]][assetKeys[0]];
        }
      }
    }

    switch (metadata.music_metadata_version) {
      case 3:
        return MetadataSchemaV3.parse(metadata);
      case 2:
        return MetadataSchemaV2.parse(metadata);
      case 1:
        return MetadataSchemaV1.parse(metadata);
      default:
        throw new Error('Unsupported CIP-60 metadata version');
    }
  }

  /**
   * Normalize metadata to a consistent structure
   * @param metadata Parsed metadata
   * @returns Normalized metadata object
   */
  static normalize(metadata: any): Record<string, any> {
    const normalized: Record<string, any> = {
      name: metadata.name,
      image: Array.isArray(metadata.image)
        ? metadata.image[0]
        : metadata.image,
      version: metadata.music_metadata_version,
      release: {
        type: metadata.release_type || metadata.release?.release_type,
        title: metadata.album_title || metadata.release?.release_title,
      },
      artists: [],
      tracks: []
    };

    if (metadata.artists) {
      normalized.artists = metadata.artists;
    } else if (metadata.release?.artists) {
      normalized.artists = metadata.release.artists;
    }

    if (metadata.files) {
      normalized.tracks = metadata.files.map((file: any) => {
        const song = file.song || file;
        return {
          name: file.name,
          title: song.song_title,
          duration: song.song_duration,
          trackNumber: song.track_number,
          mediaType: file.mediaType,
          src: file.src,
          artists: song.artists || [],
          genres: song.genres || [],
          explicit: song.explicit,
          copyright: song.copyright
        };
      });
    }

    return normalized;
  }

  /**
   * Advanced metadata extraction with fallback and error handling
   * @param metadata Raw metadata
   * @returns Safely extracted metadata
   */
  static extract(metadata: any): Record<string, any> {
    try {
      const parsed = this.parse(metadata);
      return this.normalize(parsed);
    } catch (error) {
      console.warn('Metadata parsing error:', error);

      return {
        name: metadata.name || 'Unknown',
        image: metadata.image || '/default.png',
        version: metadata.music_metadata_version || 'Unknown',
        rawMetadata: metadata
      };
    }
  }
}

export { CIP60MetadataParser };