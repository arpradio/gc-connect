import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IPFSMedia } from "./ipfsMedia";
import { AssetDetailsProps } from "@/types";
import MetadataViewer from "./metadataViewer";
import { stringToHex } from "../app/utils/hex";
import { ScrollArea } from "@/components/ui/scroll-area";
import CopyButton from "./copy";
import { parseAssetMetadata, formatArtistsString } from "@/lib/metadataParser";
import { extractImage } from "@/lib/image-utils";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";
import { any } from "zod";
import { ByteString } from "@meshsdk/core";

interface FileDetails {
  mediaType?: string;
  name?: string;
  src?: string | any;
  song?: {
    song_title?: string;
    artists?: Array<any> | SongArtists;
    explicit?: boolean | string;
    parental_advisory?: boolean | string;
    ai_generated?: boolean | string;
    isrc?: string;
    iswc?: string;
    genres?: string[];
    featured_artist?: any;
    contributing_artist?: any;
    copyright?: {
      master: string;
      composition: string;
    };
    track_number?: number | string;
    encrypted?: string;
  };
  artists?:
  | any[]
  | { name: string; isni: string; links: Record<string, string> };
  song_title?: string;
  track_number?: number | string;
  album_title?: string;
  copyright?: string;
  encrypted?: string;
}

type SongArtists = {
  name?: string;
  isni?: string;
  links?: Record<string, string>;
};

export const AssetDetails: React.FC<AssetDetailsProps> = ({
  asset,
  onClose,
}): React.ReactElement => {
  const router = useRouter();
  const metadata = parseAssetMetadata(asset);
  const [activeTab, setActiveTab] = useState<"tracks" | "metadata" | "json">(
    asset.metadata_json?.files?.some((file) =>
      file.mediaType?.startsWith("audio/")
    )
      ? "tracks"
      : "metadata"
  );
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [copied, setCopied] = useState<{
    policyId: boolean;
    assetName: boolean;
  }>({
    policyId: false,
    assetName: false,
  });

  const detailsRef = useRef<HTMLDivElement>(null);
  const hex = asset.asset_name ? stringToHex(asset.asset_name) : "";
  const files = asset.metadata_json?.files || [];
  const audioFiles = files.filter((file) =>
    file?.mediaType?.startsWith("audio/")
  );
  const tracksCount = audioFiles.length;

  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && detailsRef.current) {
      detailsRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentTrackIndex, isMobile]);

  const jsonContent = {
    "721": {
      [asset.policy_id]: {
        [asset.asset_name]: {
          ...asset.metadata_json,
        },
      },
    },
  };

  const handleGenreClick = <T extends Element>(
    e: React.MouseEvent<T, MouseEvent>,
    genre: string
  ): void => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/assets?genre=${encodeURIComponent(genre)}`);
    onClose();
  };

  const handleArtistsClick = <T extends Element>(
    e: React.MouseEvent<T, MouseEvent>,
    artists: string[]
  ): void => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/assets?search=${encodeURIComponent(artists.join(" "))}`);
    onClose();
  };

  const handleTrackNavigation = (direction: "prev" | "next"): void => {
    if (direction === "prev") {
      setCurrentTrackIndex((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentTrackIndex((prev) => Math.min(tracksCount - 1, prev + 1));
    }
  };

  const handleCopyText = async (
    text: string,
    type: "policyId" | "assetName"
  ): Promise<void> => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getArtistsFromSong = (file: FileDetails): string[] => {
    const trackArtists: string[] = [];

    if (file.artists) {
      if (Array.isArray(file.artists)) {
        file.artists.forEach((artist) => {
          if (typeof artist === "string") {
            trackArtists.push(artist);
          } else if (
            artist &&
            typeof artist === "object" &&
            "name" in artist &&
            artist.name
          ) {
            trackArtists.push(artist.name);
          }
        });
      } else if (typeof file.artists === "string") {
        trackArtists.push(file.artists);
      } else if (
        file.artists &&
        typeof file.artists === "object" &&
        "name" in file.artists &&
        file.artists.name
      ) {
        trackArtists.push(file.artists.name);
      }
    }

    if (file.song?.artists) {
      if (Array.isArray(file.song.artists)) {
        file.song.artists.forEach((artist) => {
          if (typeof artist === "string") {
            trackArtists.push(artist);
          } else if (
            artist &&
            typeof artist === "object" &&
            "name" in artist &&
            artist.name
          ) {
            trackArtists.push(artist.name);
          }
        });
      } else if (typeof file.song.artists === "string") {
        trackArtists.push(file.song.artists as string);
      } else if (
        file.song.artists &&
        typeof file.song.artists === "object" &&
        "name" in file.song.artists &&
        file.song.artists.name
      ) {
        trackArtists.push(file.song.artists.name as string);
      }
    }

    if (trackArtists.length === 0) {
      return metadata.artists.length > 0
        ? metadata.artists
        : ["Unknown Artist"];
    }

    return trackArtists;
  };

  const renderSongDetails = (
    file: FileDetails,
    index: number
  ): React.ReactNode => {
    if (!file?.mediaType?.startsWith("audio/")) return null;

    const trackArtists = getArtistsFromSong(file);

    const fileMetadata = parseAssetMetadata({
      ...asset,
      metadata_json: {
        name: metadata.name,
        image: metadata.image,
        files: [file],
      },
    });

    const audioSrc = file.src;
    const song = file.song || {
      song_title: file.song_title || file.name || null,
      track_number: file.track_number || index + 1,
      isrc: undefined,
      iswc: undefined,
      isAIGenerated: undefined,
      explicit: undefined,
    };

    const isEncrypted =
      file.encrypted === "true" || file.song?.encrypted === "true";

    return (
      <div className="bg-black/40 self-center backdrop-blur-sm rounded-lg border border-zinc-800 p-3 md:p-4 transition-all   duration-300 hover:border-zinc-700">
        {fileMetadata.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {fileMetadata.genres.map((genre, i) => (
              <span
                key={`genre-${i}`}
                onClick={(e) => handleGenreClick(e, genre)}
                className="px-2 py-0.5 bg-blue-900/60 text-blue-100 rounded border border-blue-700/50 text-xs cursor-pointer hover:bg-blue-800/60 transition-colors"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <div>
          <h3 className="font-medium text-base sm:text-lg line-clamp-2 text-white">
            {song.song_title ||
              file.song_title ||
              file.name ||
              `Track ${index + 1}`}
          </h3>

          <div
            className="text-xs sm:text-sm text-gray-300 hover:text-blue-200 m-1 cursor-pointer line-clamp-1 transition-colors"
            onClick={(e) => handleArtistsClick(e, trackArtists)}
          >
            {trackArtists.join(", ")}
          </div>

          {audioSrc && (
            <div className="mt-2 mb-3">
              <IPFSMedia
                src={audioSrc}
                type="audio"
                className="w-full"
                songTitle={file.song_title || file.name || "Audio track"}
                alt={file.song_title || file.name || "Audio track"}
                isrc={fileMetadata.isrc || file.song?.isrc}
                iswc={fileMetadata.iswc || file.song?.iswc}
                isAIGenerated={
                  fileMetadata.isAIGenerated ||
                  file.song?.ai_generated === "true"
                }
                isExplicit={
                  fileMetadata.isExplicit || file.song?.explicit === "true"
                }
                isEncrypted={isEncrypted}
              />
            </div>
          )}

          <div className="mt-3 space-y-1 text-xs text-gray-400  border-zinc-800 ">
            {fileMetadata.producer && (
              <div className="flex justify-between">
                <span className="text-gray-500">Producer:</span>
                <span>{fileMetadata.producer}</span>
              </div>
            )}

            {fileMetadata.mixEngineer && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mix Engineer:</span>
                <span>{fileMetadata.mixEngineer}</span>
              </div>
            )}

            {fileMetadata.masteringEngineer && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mastering Engineer:</span>
                <span>{fileMetadata.masteringEngineer}</span>
              </div>
            )}

            {file.copyright && (
              <div className="mt-2 pt-1 border-t border-zinc-800/50">
                <div>{file.copyright}</div>
              </div>
            )}

            {!file.copyright &&
              (fileMetadata.copyright.master ||
                fileMetadata.copyright.composition) && (
                <div className="mt-2 pt-1 border-t border-zinc-800/50">
                  {fileMetadata.copyright.master && (
                    <div>{fileMetadata.copyright.master}</div>
                  )}
                  {fileMetadata.copyright.composition && (
                    <div>{fileMetadata.copyright.composition}</div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  const extractLinks = (): Record<string, string[]> => {
    const allLinks: Record<string, string[]> = {};

    const processObjectLinks = (obj: any, category: string) => {
      if (!obj) return;

      if (obj.links && typeof obj.links === "object") {
        if (
          Object.values(obj.links).some((value) => typeof value === "object")
        ) {
          Object.entries(obj.links).forEach(([artistName, platforms]) => {
            if (typeof platforms === "object" && platforms !== null) {
              if (!allLinks[artistName]) {
                allLinks[artistName] = [];
              }

              Object.entries(platforms as Record<string, any>).forEach(
                ([platform, url]) => {
                  if (typeof url === "string") {
                    allLinks[artistName].push(`${platform}:${url}`);
                  } else if (
                    Array.isArray(url) &&
                    url.length > 0 &&
                    typeof url[0] === "string"
                  ) {
                    allLinks[artistName].push(`${platform}:${url[0]}`);
                  }
                }
              );
            }
          });
        } else {
          if (!allLinks[category]) {
            allLinks[category] = [];
          }

          Object.entries(obj.links).forEach(([linkName, url]) => {
            if (typeof url === "string") {
              allLinks[category].push(`${linkName}:${url}`);
            } else if (
              Array.isArray(url) &&
              url.length > 0 &&
              typeof url[0] === "string"
            ) {
              allLinks[category].push(`${linkName}:${url[0]}`);
            }
          });
        }
      }

      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        Object.entries(obj).forEach(([key, value]) => {
          if (
            key !== "links" &&
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            processObjectLinks(value, category);
          }
        });
      }
    };

    processObjectLinks(asset.metadata_json, "General");

    const artists =
      asset.metadata_json?.artists ||
      asset.metadata_json?.release?.artists ||
      [];
    if (Array.isArray(artists)) {
      artists.forEach((artist, index) => {
        const artistName = artist.name || `Artist ${index + 1}`;
        processObjectLinks(artist, artistName);
      });
    }

    const files = asset.metadata_json?.files || [];
    files.forEach((file, fileIndex) => {
      processObjectLinks(file, `File ${fileIndex + 1}`);

      if (file.song) {
        const songArtists = file.song.artists || [];
        if (Array.isArray(songArtists)) {
          songArtists.forEach((artist, index) => {
            const artistName =
              typeof artist === "string"
                ? artist
                : artist &&
                  typeof artist === "object" &&
                  "name" in artist &&
                  artist.name
                  ? artist.name
                  : `Track ${fileIndex + 1} Artist ${index + 1}`;

            if (typeof artist === "object" && artist !== null) {
              processObjectLinks(artist, artistName);
            }
          });
        }

        const featuredArtists =
          file.song.featured_artists ||
          (file.song as any).featured_artist ||
          [];
        const featArtistsArray = Array.isArray(featuredArtists)
          ? featuredArtists
          : typeof featuredArtists === "string"
            ? [featuredArtists]
            : [];

        featArtistsArray.forEach((artist, index) => {
          const artistName =
            typeof artist === "string"
              ? artist
              : artist &&
                typeof artist === "object" &&
                "name" in artist &&
                artist.name
                ? artist.name
                : `Featured Artist ${index + 1}`;

          if (typeof artist === "object" && artist !== null) {
            processObjectLinks(artist, artistName);
          }
        });

        const contributingArtists =
          file.song.contributing_artists ||
          (file.song as any).contributing_artist ||
          [];
        const contArtistsArray = Array.isArray(contributingArtists)
          ? contributingArtists
          : typeof contributingArtists === "string"
            ? [contributingArtists]
            : [];

        contArtistsArray.forEach((artist, index) => {
          const artistName =
            typeof artist === "string"
              ? artist
              : artist &&
                typeof artist === "object" &&
                "name" in artist &&
                artist.name
                ? artist.name
                : `Contributing Artist ${index + 1}`;

          if (typeof artist === "object" && artist !== null) {
            processObjectLinks(artist, artistName);
          }
        });
      }
    });

    return allLinks;
  };

  const handleExternalLinkClick = (url: string): void => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case "tracks":
        if (isMobile && audioFiles.length > 0) {
          const currentFile = audioFiles[currentTrackIndex];
          if (!currentFile) return null;

          return (
            <div>
              <div className="flex items-center justify-between mb-3 bg-gray-800/50 rounded-lg p-2">
                <button
                  onClick={() => handleTrackNavigation("prev")}
                  disabled={currentTrackIndex === 0}
                  className={`p-2 rounded-full ${currentTrackIndex === 0
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:bg-gray-700/50 active:bg-gray-700"
                    }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-center font-medium">
                  Track {currentTrackIndex + 1} of {audioFiles.length}
                </span>
                <button
                  onClick={() => handleTrackNavigation("next")}
                  disabled={currentTrackIndex >= audioFiles.length - 1}
                  className={`p-2 rounded-full ${currentTrackIndex >= audioFiles.length - 1
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:bg-gray-700/50 active:bg-gray-700"
                    }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              {renderSongDetails(currentFile, currentTrackIndex)}
            </div>
          );
        }

        return (
          <div className="space-y-4 pb-2 w-full">
            {audioFiles.map((file, index) => {
              const songDetails = renderSongDetails(file, index);
              return songDetails ? (
                <div key={`track-${index}`} className="mb-4 w-full">
                  {songDetails}
                </div>
              ) : null;
            })}
            {files
              .filter((file) => !file?.mediaType?.startsWith("audio/"))
              .map((file, index) => (
                <div key={`other-${index}`} className="mb-4 w-full">
                  <MetadataViewer
                    data={file}
                    className="bg-black/30 border border-zinc-800 rounded-lg w-full"
                    onFieldClick={(path, value) => console.log(path, value)}
                  />
                </div>
              ))}
          </div>
        );

      case "metadata":
        const links = extractLinks();
        const hasLinks = Object.keys(links).length > 0;

        return (
          <div className="w-full space-y-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 hover:border-zinc-700">
              <h3 className="text-lg font-medium text-amber-100 mb-3 border-b border-zinc-700/50 pb-2">
                Release Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metadata.name && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Title</span>
                    <span className="text-sm text-white">{metadata.name}</span>
                  </div>
                )}
                {metadata.artists?.length > 0 && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">
                      Artist{metadata.artists.length > 1 ? "s" : ""}
                    </span>
                    <span
                      className="text-sm text-blue-200 cursor-pointer hover:text-blue-300 transition-colors"
                      onClick={(e) => handleArtistsClick(e, metadata.artists)}
                    >
                      {formatArtistsString(metadata)}
                    </span>
                  </div>
                )}
                {metadata.releaseDate && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Release Date</span>
                    <span className="text-sm text-white">
                      {metadata.releaseDate}
                    </span>
                  </div>
                )}
                {metadata.genres?.length > 0 && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {metadata.genres.map((genre, i) => (
                        <span
                          key={`genre-detail-${i}`}
                          onClick={(e) => handleGenreClick(e, genre)}
                          className="px-2 py-0.5 bg-blue-900/60 text-blue-100 text-xs rounded border border-blue-700/50 cursor-pointer hover:bg-blue-800/60 transition-colors"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {metadata.label && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Label</span>
                    <span className="text-sm text-white">{metadata.label}</span>
                  </div>
                )}
                {metadata.publisher && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-400">Publisher</span>
                    <span className="text-sm text-white">
                      {metadata.publisher}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {hasLinks && (
              <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 hover:border-zinc-700">
                <h3 className="text-lg font-medium text-amber-100 mb-3 border-b border-zinc-700/50 pb-2">
                  Links
                </h3>
                <div className="space-y-4">
                  {Object.entries(links).map(([category, categoryLinks]) => (
                    <div
                      key={`link-category-${category}`}
                      className="space-y-2"
                    >
                      <h4 className="text-sm font-medium text-gray-300">
                        {category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {categoryLinks.map((linkEntry, index) => {
                          const parts = linkEntry.split(":");
                          const linkName = parts[0];
                          const url = parts.slice(1).join(":");

                          return (
                            <a
                              key={`link-${category}-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700/80 text-blue-300 hover:text-blue-200 rounded-md text-xs border border-blue-900/50 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                handleExternalLinkClick(url);
                              }}
                            >
                              <LinkIcon size={12} />
                              <span className="capitalize">{linkName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(metadata.producer ||
              metadata.mixEngineer ||
              metadata.masteringEngineer) && (
                <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 hover:border-zinc-700">
                  <h3 className="text-lg font-medium text-amber-100 mb-3 border-b border-zinc-700/50 pb-2">
                    Credits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metadata.producer && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">Producer</span>
                        <span className="text-sm text-white">
                          {metadata.producer}
                        </span>
                      </div>
                    )}
                    {metadata.mixEngineer && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">
                          Mix Engineer
                        </span>
                        <span className="text-sm text-white">
                          {metadata.mixEngineer}
                        </span>
                      </div>
                    )}
                    {metadata.masteringEngineer && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">
                          Mastering Engineer
                        </span>
                        <span className="text-sm text-white">
                          {metadata.masteringEngineer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {(metadata.copyright?.master ||
              metadata.copyright?.composition ||
              metadata.isrc ||
              metadata.iswc) && (
                <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 hover:border-zinc-700">
                  <h3 className="text-lg font-medium text-amber-100 mb-3 border-b border-zinc-700/50 pb-2">
                    Rights Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metadata.isrc && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">ISRC</span>
                        <span className="text-sm text-white font-mono">
                          {metadata.isrc}
                        </span>
                      </div>
                    )}
                    {metadata.iswc && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-400">ISWC</span>
                        <span className="text-sm text-white font-mono">
                          {metadata.iswc}
                        </span>
                      </div>
                    )}
                  </div>

                  {(metadata.copyright?.master ||
                    metadata.copyright?.composition) && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/50 space-y-2">
                        {metadata.copyright.master && (
                          <div className="text-xs text-gray-300">
                            {metadata.copyright.master}
                          </div>
                        )}
                        {metadata.copyright.composition && (
                          <div className="text-xs text-gray-300">
                            {metadata.copyright.composition}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}

            {metadata.isAIGenerated !== undefined && (
              <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-zinc-800 p-4 transition-all duration-300 hover:border-zinc-700">
                <h3 className="text-lg font-medium text-amber-100 mb-3 border-b border-zinc-700/50 pb-2">
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {metadata.isAIGenerated !== undefined && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">
                        AI Generated
                      </span>
                      <span className="text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${metadata.isAIGenerated
                            ? "bg-purple-900/60 text-purple-100 border border-purple-700/50"
                            : "bg-gray-800 text-gray-300 border border-gray-700/50"
                            }`}
                        >
                          {metadata.isAIGenerated ? "Yes" : "No"}
                        </span>
                      </span>
                    </div>
                  )}
                  {metadata.isExplicit !== undefined && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">
                        Explicit Content
                      </span>
                      <span className="text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${metadata.isExplicit
                            ? "bg-red-900/60 text-red-100 border border-red-700/50"
                            : "bg-gray-800 text-gray-300 border border-gray-700/50"
                            }`}
                        >
                          {metadata.isExplicit ? "Explicit" : "Clean"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "json":
        return (
          <div className="w-full max-w-[20rem] relative">
            <div className="fixed right-8 z-10">
              <CopyButton content={jsonContent} />
            </div>
            <div className="pt-8 w-full">
              <pre className="font-mono text-xs whitespace-pre-wrap text-gray-300 w-full">
                {JSON.stringify(jsonContent, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  const coverImage = extractImage(metadata.image);

  return (
    <div
      ref={detailsRef}
      className="text-white bg-slate-900/95 backdrop-blur-md border border-zinc-700/80 rounded-lg max-h-[95dvh] sm:max-h-[85dvh] h-[95dvh] sm:h-[85dvh] w-[95vw] sm:w-[calc(100vw-40px)] md:w-[85vw] lg:w-[90vw] max-w-[1200px] overflow-hidden flex flex-col"
    >
      <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur-md border-b border-zinc-700/50 p-3 sm:p-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-2xl font-bold truncate max-w-[calc(100%-40px)] line-clamp-1">
          {metadata.name}
        </h2>
      </div>

      <div className="flex-grow overflow-hidden p-3 sm:p-4 min-h-0 h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 md:gap-6 w-full h-full min-h-0 max-h-full">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="aspect-square mx-auto max-h-[200px] md:max-h-[100%] flex justify-center w-fit">
              <IPFSMedia
                src={coverImage}
                type="image"
                fill
                className="flex border-zinc-800 border rounded-lg object-cover shadow-lg"
                alt="Album art"
              />
            </div>
          </div>

          <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
            <div className="flex gap-1 flex-wrap mb-3 flex-shrink-0">
              <button
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors border ${activeTab === "tracks"
                  ? "bg-amber-900/30 text-amber-100 border-amber-700/50"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-zinc-700/50"
                  }`}
                onClick={() => setActiveTab("tracks")}
              >
                Tracks
              </button>
              <button
                className={`px-3 py-1.5 text-xs sm:text-sm border rounded-lg transition-colors ${activeTab === "metadata"
                  ? "bg-blue-900/30 text-blue-100 border-blue-700/50"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-zinc-700/50"
                  }`}
                onClick={() => setActiveTab("metadata")}
              >
                Details
              </button>
              <button
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${activeTab === "json"
                  ? "bg-purple-900/30 text-purple-100 border-purple-700/50"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-zinc-700/50"
                  }`}
                onClick={() => setActiveTab("json")}
              >
                JSON
              </button>
            </div>

            <div className="flex-grow min-h-0 h-full overflow-hidden bg-black/10 rounded-lg border border-zinc-800">
              <ScrollArea className="h-full w-full">
                <div className="p-2 pb-12 min-w-0 w-full overflow-hidden">
                  {renderTabContent()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md border-t border-zinc-700/50 p-3 sm:p-4 mt-auto">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">
          Token Information
        </h3>
        <div className="flex flex-col gap-3 text-xs sm:text-sm">
          <div className="bg-black/30 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 w-24 flex-shrink-0">
                Policy ID:
              </span>
              <span className="text-amber-100 truncate flex-grow px-2">
                {asset.policy_id}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopyText(asset.policy_id, "policyId")}
                  className="p-1.5 rounded-md hover:bg-gray-800 transition-colors border border-zinc-700"
                  title="Copy policy ID"
                  type="button"
                >
                  {copied.policyId ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() =>
                    handleExternalLinkClick(
                      `https://cardanoscan.io/token/${asset.policy_id}`
                    )
                  }
                  className="p-1.5 rounded-md hover:bg-gray-800 transition-colors border border-zinc-700"
                  title="View on CardanoScan"
                  type="button"
                >
                  <ExternalLink size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 w-24 flex-shrink-0">
                Asset Name:
              </span>
              <span className="text-amber-100 truncate flex-grow px-2">
                {asset.asset_name}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopyText(asset.asset_name, "assetName")}
                  className="p-1.5 rounded-md hover:bg-gray-800 transition-colors border border-zinc-700"
                  title="Copy asset name"
                  type="button"
                >
                  {copied.assetName ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() =>
                    handleExternalLinkClick(
                      `https://www.jpg.store/asset/${asset.policy_id}${hex}`
                    )
                  }
                  className="p-1.5 rounded-md hover:bg-gray-800 transition-colors border border-zinc-700"
                  title="View on jpg.store"
                  type="button"
                >
                  <ExternalLink size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
