import React from "react";
import { useRouter } from "next/navigation";
import { IPFSMedia } from "./ipfsMedia";
import { Asset } from "@/types";
import { cn } from "@/lib/utils";
import { getIPFSUrl } from "../actions/ipfs";

const extractMetadata = (asset: Asset) => {
  const metadata = asset.metadata_json || {};
  const files = metadata.files || [];
  const song = files[0]?.song || {};
  const release = metadata.release || {};

  const isExplicit = !!(
    song.explicit ||
    song.parental_advisory ||
    (metadata as any).parental_advisory ||
    (release as any).parental_advisory
  );

  return {
    title:
      metadata.name ||
      song.song_title ||
      release.release_title ||
      asset.asset_name ||
      "Untitled",
    artists: extractArtists(metadata),
    genres: extractGenres(metadata),
    image: extractImage(metadata),
    isExplicit,
    isAIGenerated: !!song.ai_generated,
    releaseType: release.release_type || null,
  };
};

const extractArtists = (metadata: any): string[] => {
  const artists = new Set<string>();

  const processArtist = (artist: any): void => {
    if (typeof artist === "string") {
      artists.add(artist);
      return;
    }
    if (artist?.name) {
      artists.add(artist.name);
      return;
    }
    if (artist?.["name:"]) {
      artists.add(artist["name:"]);
      return;
    }
  };

  if (metadata.artists) {
    const rootArtists = metadata.artists;
    if (Array.isArray(rootArtists)) {
      rootArtists.forEach(processArtist);
    } else {
      processArtist(rootArtists);
    }
  }

  if (metadata.release?.artists) {
    const releaseArtists = metadata.release.artists;
    if (Array.isArray(releaseArtists)) {
      releaseArtists.forEach(processArtist);
    } else {
      processArtist(releaseArtists);
    }
  }

  if (metadata.files?.length > 0) {
    for (const file of metadata.files) {
      if (file.song?.artists) {
        const songArtists = file.song.artists;
        if (Array.isArray(songArtists)) {
          songArtists.forEach(processArtist);
        } else {
          processArtist(songArtists);
        }
      }

      if (file.artists) {
        const fileArtists = file.artists;
        if (Array.isArray(fileArtists)) {
          fileArtists.forEach(processArtist);
        } else {
          processArtist(fileArtists);
        }
      }

      if (file.featured_artist) {
        processArtist(file.featured_artist);
      }

      if (file.song?.featured_artists) {
        const featuredArtists = file.song.featured_artists;
        if (Array.isArray(featuredArtists)) {
          featuredArtists.forEach(processArtist);
        } else {
          processArtist(featuredArtists);
        }
      }
    }
  }

  return Array.from(artists).length > 0
    ? Array.from(artists)
    : ["Unknown Artist"];
};

const extractGenres = (metadata: any): string[] => {
  const genres = new Set<string>();

  [
    metadata.files?.[0]?.song?.genres,
    metadata.release?.genres,
    metadata.genres,
  ].forEach((genreList) => {
    if (Array.isArray(genreList)) {
      genreList.forEach((genre) => {
        if (typeof genre === "string") genres.add(genre);
      });
    } else if (typeof genreList === "string") {
      genres.add(genreList);
    }
  });

  return Array.from(genres);
};

const extractImage = (metadata: any): string => {
  const image = metadata.image || metadata.files?.[0]?.src;

  if (!image) return "/default.png";

  if (typeof image === "string") {
    return getIPFSUrl(image);
  }

  if (Array.isArray(image)) {
    const combinedImage = image.join("");
    return getIPFSUrl(combinedImage);
  }

  return "/default.png";
};

export interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  compact?: boolean;
  className?: string;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onClick,
  compact = false,
  className,
}) => {
  const router = useRouter();

  try {
    const {
      title,
      artists,
      genres,
      image,
      isExplicit,
      isAIGenerated,
      releaseType,
    } = extractMetadata(asset);

    const handleArtistClick = (
      e: React.MouseEvent<HTMLSpanElement>,
      artist: string
    ): void => {
      e.preventDefault();
      e.stopPropagation();
      const searchFields = JSON.stringify({ artist: true });
      router.push(`/assets?search=${encodeURIComponent(artist)}&searchFields=${encodeURIComponent(searchFields)}`);
    };

    const handleGenreClick = (
      e: React.MouseEvent<HTMLSpanElement>,
      genre: string
    ): void => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/assets?genre=${encodeURIComponent(genre)}`);
    };

    return (
      <div
        className={cn(
          "group relative bg-slate-800/40 rounded-lg border border-white/10",
          "hover:border-white/30 hover:bg-slate-800/60 transition-all duration-200",
          "overflow-hidden shadow-md hover:shadow-lg",
          className
        )}
      >
        <div className="absolute top-2 right-2 flex flex-wrap justify-end gap-1.5 max-w-[50%] z-10">
          {isExplicit && (
            <span className="inline-block px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded-sm border border-red-500/20 text-[10px] uppercase tracking-wide font-semibold">
              Explicit
            </span>
          )}

          {isAIGenerated && (
            <span className="inline-block px-1.5 py-0.5 bg-purple-900/40 text-purple-400 rounded-sm border border-purple-500/20 text-[10px] uppercase tracking-wide font-semibold">
              AI
            </span>
          )}

          {!compact && releaseType && (
            <span className="inline-block px-1.5 py-0.5 bg-amber-900/40 text-amber-400 rounded-sm border border-amber-500/20 text-[10px] uppercase tracking-wide font-semibold">
              {releaseType}
            </span>
          )}
        </div>

        <div className="flex p-4 w-full gap-3">
          <div
            className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20  rounded overflow-hidden cursor-pointer"
            onClick={onClick}
          >
            <IPFSMedia
              src={image}
              type="image"
              fill
              className="object-cover flex group-hover:scale-105 transition-transform duration-300"
              alt={`Album art for ${title}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-white text-[1rem] w-36 text-nowrap truncate pr-2 cursor-pointer"
              onClick={onClick}
            >
              {title}
            </h3>

            <p className="text-zinc-400 text-xs sm:text-sm text-clip truncate mt-1">
              {artists.map((artist, index) => (
                <React.Fragment key={`artist-${artist}-${index}`}>
                  {index > 0 && ", "}
                  <span
                    onClick={(e) => handleArtistClick(e, artist)}
                    className="hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {artist}
                  </span>
                </React.Fragment>
              ))}
            </p>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {genres.slice(0, 3).map((genre, i) => (
                  <span
                    key={`genre-${genre}-${i}`}
                    onClick={(e) => handleGenreClick(e, genre)}
                    className="px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded-sm border border-blue-500/20 
                             text-[10px] font-medium hover:bg-blue-900/60 hover:text-blue-300 
                             transition-colors cursor-pointer truncate max-w-[80px]"
                  >
                    {genre}
                  </span>
                ))}

                {genres.length > 3 && (
                  <span
                    className="px-1.5 py-0.5 bg-gray-800/80 text-gray-400 rounded-sm border border-gray-700 
                                 text-[10px] font-medium truncate"
                  >
                    +{genres.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering asset card:", error, asset);
    return (
      <div
        onClick={onClick}
        className="bg-neutral-800 rounded-lg p-4 border border-red-500/50 cursor-pointer"
      >
        <div className="text-white text-sm">Error displaying asset</div>
      </div>
    );
  }
};

export default AssetCard;