import { CIP60FormData } from '@/types';

export interface BuildMetadataParams {
  formData: CIP60FormData;
  songIPFS: string;
  coverIPFS: string;
  audioFormat: string;
  minutes: number;
  seconds: number;
}

export function buildMetadata({
  formData,
  songIPFS,
  coverIPFS,
  audioFormat,
  minutes,
  seconds
}: BuildMetadataParams) {
  const mainArtist = formData.artists[0];

  const metadata = {
    "721": {
      "{get('cache.dependencies.mintingPolicy.scriptHashHex')}": {
        "{get('cache.dependencies.assetName')}": {
          "name": `${mainArtist.name} - ${formData.releaseTitle}`,
          "image": `ipfs://${coverIPFS}`,
          "music_metadata_version":"3",
          "release": {
            "release_type": "Single",
            "release_title": formData.releaseTitle,
          },
          "files": [
            {
              "name": formData.songTitle,
              "mediaType": audioFormat,
              "src": `ipfs://${songIPFS}`,
              "song": {
     
                "artists": formData.artists.map(artist => ({
                  name: artist.name,
                  ...(artist.isni && { isni: artist.isni }),
                  ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                })),
                
                ...(formData.featuredArtists.length > 0 && {
                  "featured_artists": formData.featuredArtists.map(artist => ({
                    name: artist.name,
                    ...(artist.isni && { isni: artist.isni }),
                    ...(Object.keys(artist.links).length > 0 && { links: artist.links })
                  }))
                }),

                ...(formData.contributingArtists.length > 0 && {
                  "contributing_artists": formData.contributingArtists.map(artist => ({
                    name: artist.name,
                    ...(artist.ipn && { ipn: artist.ipn }),
                    ...(artist.ipi && { ipi: artist.ipi }),
                    ...(artist.roles?.length > 0 && { role: artist.roles }),
                    ...(Object.keys(artist.links || {}).length > 0 && { links: artist.links })
                  }))
                }),

                ...(formData.authors.length > 0 && !formData.isAIGenerated && {
                  "authors": formData.authors.map(author => ({
                    name: author.name,
                    ...(author.ipi ? { ipi: author.ipi } : {}),
                    ...(author.share ? { share: `${author.share}%` } : {}),
                    ...(author.role ? { role: author.role } : {})
                  }))
                }),

                ...(formData.isExplicit && {
                  "explicit": "true"
                }),

                ...(formData.isAIGenerated ? {
                  "ai_generated": "true",
                  "copyright": {
                    "master": `℗ ${formData.recordingOwner}`,
                    "composition": "© N/A - AI Generated"
                  }
                } : {
                  "copyright": {
                    "master": `℗ ${formData.recordingOwner}`,
                    "composition": `© ${formData.compositionOwner}`
                  }
                }),

                "genres": [
                  `${formData.genre}`,
                  `${formData.subGenre1}`,
                 `${formData.subGenre2}`
                ].filter(Boolean),

                "song_duration": `PT${minutes}M${seconds}S`,
                "song_title": formData.songTitle,
                "track_number": "1",
                ...(formData.producer && { "producer": formData.producer }),
                ...(formData.mastering_engineer && { "mastering_engineer": formData.mastering_engineer }),
                ...(formData.mix_engineer && { "mix_engineer": formData.mix_engineer }),
                ...(formData.isrc && { "isrc": formData.isrc }),
                ...(formData.iswc && !formData.isAIGenerated && { 
                  "iswc": formData.iswc
                })
              }
            }
          ]
        }
      }
    }
  };

  return metadata;
}