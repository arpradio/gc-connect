export interface TokenomicsInfo {
    totalSupply?: number;
    royaltyPercentage?: number;
}

export interface CopyrightInfo {
    master?: string;
    composition?: string;
}

export interface AssetMetadata {
    name: string;
    description?: string;
    image?: string;
    artists: string[];
    genres: string[];
    releaseTitle?: string;
    releaseDate?: string;
    releaseType: string;
    duration?: string;
    tokenomics?: TokenomicsInfo;
    label?: string;
    totalTracks?: number | null,
    publisher?: string;

    songTitle?: string;
    isrc?: string;
    iswc?: string;
    isAIGenerated?: boolean;
    isExplicit?: boolean;
    producer?: string;
    mixEngineer?: string;
    masteringEngineer?: string;
    copyright: CopyrightInfo;
}

export function parseAssetMetadata(asset: any): AssetMetadata {
    const metadata = asset?.metadata_json || {};
    const result: AssetMetadata = {
        name: '',
        artists: [],
        genres: [],
        copyright: { master: undefined, composition: undefined },
        releaseType: ""
    };

    try {
        result.name = typeof metadata.name === 'string' ? metadata.name :
            (typeof asset.displayName === 'string' ? asset.displayName :
                (typeof asset.assetName === 'string' ? asset.assetName : 'Unknown'));

        if (typeof metadata.image === 'string') {
            result.image = metadata.image;
        } else if (metadata.files?.[0]?.src && typeof metadata.files[0].src === 'string') {
            result.image = metadata.files[0].src;
        } else {
            result.image = '/default.png';
        }

        const artists = new Set<string>();

        const processArtist = (artist: any) => {
            if (!artist) return;

            if (typeof artist === 'string') {
                artists.add(artist);
            } else if (artist && artist.name && typeof artist.name === 'string') {
                artists.add(artist.name);
            } else if (artist && artist['name:'] && typeof artist['name:'] === 'string') {
                artists.add(artist['name:']);
            }
        };

        const songArtists = metadata.files?.[0]?.song?.artists;
        const releaseArtists = metadata.release?.artists;

        if (Array.isArray(songArtists)) {
            songArtists.forEach(processArtist);
        } else if (songArtists) {
            processArtist(songArtists);
        }

        if (Array.isArray(metadata.artists)) {
            metadata.artists.forEach(processArtist);
        } else if (typeof metadata.artists === 'string') {
            artists.add(metadata.artists);
        } else if (metadata.artists) {
            processArtist(metadata.artists);
        }

        if (Array.isArray(releaseArtists)) {
            releaseArtists.forEach(processArtist);
        } else if (typeof releaseArtists === 'string') {
            artists.add(releaseArtists);
        } else if (releaseArtists) {
            processArtist(releaseArtists);
        }

        result.artists = Array.from(artists).length > 0 ? Array.from(artists) : ['Unknown Artist'];

        const genres = new Set<string>();

        const song = metadata.files?.[0]?.song;
        const release = metadata.release;

        if (song?.genres) {
            if (Array.isArray(song.genres)) {
                song.genres.forEach((genre: any) => {
                    if (typeof genre === 'string') {
                        genres.add(genre);
                    }
                });
            } else if (typeof song.genres === 'string') {
                genres.add(song.genres);
            }
        }

        if (metadata.genres) {
            if (Array.isArray(metadata.genres)) {
                metadata.genres.forEach((genre: any) => {
                    if (typeof genre === 'string') {
                        genres.add(genre);
                    }
                });
            } else if (typeof metadata.genres === 'string') {
                genres.add(metadata.genres);
            }
        }

        if (release?.genres) {
            if (Array.isArray(release.genres)) {
                release.genres.forEach((genre: any) => {
                    if (typeof genre === 'string') {
                        genres.add(genre);
                    }
                });
            } else if (typeof release.genres === 'string') {
                genres.add(release.genres);
            }
        }

        result.genres = Array.from(genres);

        if (release?.release_title && typeof release.release_title === 'string') {
            result.releaseTitle = release.release_title;
        } else if (metadata.album_title && typeof metadata.album_title === 'string') {
            result.releaseTitle = metadata.album_title;
        }

        if (song?.song_duration && typeof song.song_duration === 'string') {
            result.duration = song.song_duration;
        } else if (metadata.song_duration && typeof metadata.song_duration === 'string') {
            result.duration = metadata.song_duration;
        }

        if (song?.song_title && typeof song.song_title === 'string') {
            result.songTitle = song.song_title;
        } else if (metadata.song_title && typeof metadata.song_title === 'string') {
            result.songTitle = metadata.song_title;
        } else if (metadata.files?.[0]?.song_title && typeof metadata.files[0].song_title === 'string') {
            result.songTitle = metadata.files[0].song_title;
        } else if (metadata.files?.[0]?.name && typeof metadata.files[0].name === 'string') {
            result.songTitle = metadata.files[0].name;
        }

        if (song?.isrc && typeof song.isrc === 'string') {
            result.isrc = song.isrc;
        } else if (metadata.isrc && typeof metadata.isrc === 'string') {
            result.isrc = metadata.isrc;
        }

        if (song?.iswc && typeof song.iswc === 'string') {
            result.iswc = song.iswc;
        } else if (metadata.iswc && typeof metadata.iswc === 'string') {
            result.iswc = metadata.iswc;
        }

        result.isAIGenerated = song?.ai_generated === true || metadata.ai_generated === true;
        result.isExplicit = song?.explicit === true || metadata.explicit === true || release?.song_explicit === true || metadata.parental_advisory === 'Explicit' || release?.parental_advisory === 'Explicit';

        if (song?.producer && typeof song.producer === 'string') {
            result.producer = song.producer;
        } else if (metadata.producer && typeof metadata.producer === 'string') {
            result.producer = metadata.producer;
        }

        if (song?.mix_engineer && typeof song.mix_engineer === 'string') {
            result.mixEngineer = song.mix_engineer;
        } else if (metadata.mix_engineer && typeof metadata.mix_engineer === 'string') {
            result.mixEngineer = metadata.mix_engineer;
        }

        if (song?.mastering_engineer && typeof song.mastering_engineer === 'string') {
            result.masteringEngineer = song.mastering_engineer;
        } else if (metadata.mastering_engineer && typeof metadata.mastering_engineer === 'string') {
            result.masteringEngineer = metadata.mastering_engineer;
        }

        if (song?.copyright) {
            if (typeof song.copyright === 'object') {
                if (song.copyright.master && typeof song.copyright.master === 'string') {
                    result.copyright.master = song.copyright.master;
                }
                if (song.copyright.composition && typeof song.copyright.composition === 'string') {
                    result.copyright.composition = song.copyright.composition;
                }
            } else if (typeof song.copyright === 'string') {
                result.copyright.master = song.copyright;
            }
        } else if (release?.copyright) {
            if (typeof release.copyright === 'object') {
                if (release.copyright.master && typeof release.copyright.master === 'string') {
                    result.copyright.master = release.copyright.master;
                }
                if (release.copyright.composition && typeof release.copyright.composition === 'string') {
                    result.copyright.composition = release.copyright.composition;
                }
            } else if (typeof release.copyright === 'string') {
                result.copyright.master = release.copyright;
            }
        } else if (metadata.copyright) {
            if (typeof metadata.copyright === 'object') {
                if (metadata.copyright.master && typeof metadata.copyright.master === 'string') {
                    result.copyright.master = metadata.copyright.master;
                }
                if (metadata.copyright.composition && typeof metadata.copyright.composition === 'string') {
                    result.copyright.composition = metadata.copyright.composition;
                }
            } else if (typeof metadata.copyright === 'string') {
                result.copyright.master = metadata.copyright;
            }
        }

        if (metadata.description && typeof metadata.description === 'string') {
            result.description = metadata.description;
        }

        if (release?.release_date && typeof release.release_date === 'string') {
            result.releaseDate = release.release_date;
        } else if (metadata.release_date && typeof metadata.release_date === 'string') {
            result.releaseDate = metadata.release_date;
        }

    } catch (error) {
        console.error('Error parsing asset metadata:', error);
    }

    return result;
}

export function formatArtistsString(metadata: AssetMetadata): string {
    return metadata.artists.length > 0
        ? metadata.artists.join(', ')
        : 'Unknown Artist';
}

export function getIPFSImageUrl(src: string | undefined | null): string {
    if (!src || typeof src !== 'string') return '/default.png';

    if (src.startsWith('data:')) {
        return src;
    }

    if (src.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${src.replace('ipfs://', '')}`;
    }

    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(src) ||
        /^bafy[a-zA-Z0-9]{44,}/.test(src)) {
        return `https://ipfs.io/ipfs/${src}`;
    }

    return src;
}

export function hexToUtf8(hex: string): string {
    try {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        const bytes = new Uint8Array(
            cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
        return new TextDecoder().decode(bytes);
    } catch {
        return hex;
    }
}