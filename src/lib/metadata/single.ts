import { CIP60FormData } from '@/types';
import { FileDetails, CommonMusicDetails } from './types';

interface BuildMetadataParams {
  formData: CIP60FormData;
  songIPFS: string;
  coverIPFS: string;
  audioFormat: string;
  minutes: number;
  seconds: number;
}

export const buildMetadata = ({
  formData,
  songIPFS,
  coverIPFS,
  audioFormat,
  minutes,
  seconds
}: BuildMetadataParams) => {
  const {
    releaseTitle,
    songTitle,
    artists,
    featuredArtists,
    contributingArtists,
    authors,
    genre,
    subGenre1,
    subGenre2,
    isAIGenerated,
    isExplicit,
    recordingOwner,
    compositionOwner,
    isrc,
    iswc,
    producer,
    mix_engineer,
    mastering_engineer
  } = formData;

  const fileDetails: FileDetails = {
    name: songTitle,
    mediaType: audioFormat,
    src: `ipfs://${songIPFS}`,
    song: {
      song_title: songTitle,
      song_duration: `PT${minutes}M${seconds}S`,
      track_number: "1",
      
      // Optional fields
      ...(isrc && { isrc }),
      ...(iswc && !isAIGenerated && { iswc }),
      ...(producer && { producer }),
      ...(mix_engineer && { mix_engineer }),
      ...(mastering_engineer && { mastering_engineer }),
      
      ...(isAIGenerated && { ai_generated: true }),
      ...(isExplicit && { explicit: true }),
      
      // Common music details
      artists: artists.map(({ name, isni, links }) => ({
        name,
        ...(isni && { isni }),
        ...(Object.keys(links).length > 0 && { links })
      })),
      
      genres: [genre, subGenre1, subGenre2].filter(Boolean),
      
      copyright: {
        master: `℗ ${recordingOwner}`,
        composition: isAIGenerated 
          ? "© Not Applicable - AI Generated"
          : `© ${compositionOwner}`
      },
      
      ...(contributingArtists.length > 0 && { contributing_artists: contributingArtists }),
      ...(featuredArtists.length > 0 && { featured_artists: featuredArtists }),
      ...(authors.length > 0 && { authors })
    }
  };

  return {
    "721": {
      "<policy_id>": {
        [releaseTitle.replace(/\s+/g, '')]: {
          name: releaseTitle,
          image: `ipfs://${coverIPFS}`,
          music_metadata_version: 3,
          release: {
            release_type: "Single",
            release_title: releaseTitle,
          },
          files: [fileDetails]
        }
      }
    }
  };
};