import { Asset } from '@/types';

/**
 * Checks if an asset is a valid music asset according to the CIP-60 standard
 */
export const isMusicAsset = (asset: Asset): boolean => {
    try {
        // Check if it has a music_metadata_version field
        if (asset.metadata_json?.music_metadata_version) {
            return true;
        }

        // Check if it has any files with audio mediaType
        if (asset.metadata_json?.files?.some(file =>
            file.mediaType?.startsWith('audio/') ||
            (file.song && file.src)
        )) {
            return true;
        }

        // Check for song-related properties
        const hasSongDetails = asset.metadata_json?.files?.some(file =>
            file.song?.song_title || file.song?.artists
        );

        if (hasSongDetails) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking if asset is music asset:', error);
        return false;
    }
};

/**
 * Filters a list of assets to only include music assets
 */
export const filterMusicAssets = (assets: Asset[]): Asset[] => {
    return assets.filter(isMusicAsset);
};

/**
 * Groups music assets by policy ID
 */
export const groupAssetsByPolicy = (assets: Asset[]): Record<string, Asset[]> => {
    return assets.reduce<Record<string, Asset[]>>((groups, asset) => {
        if (!groups[asset.policy_id]) {
            groups[asset.policy_id] = [];
        }
        groups[asset.policy_id].push(asset);
        return groups;
    }, {});
};

/**
 * Sorts music assets by their policy ID and/or asset name
 */
export const sortMusicAssets = (
    assets: Asset[],
    sortBy: 'policyId' | 'assetName' | 'both' = 'both',
    direction: 'asc' | 'desc' = 'asc'
): Asset[] => {
    return [...assets].sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'policyId' || sortBy === 'both') {
            comparison = a.policy_id.localeCompare(b.policy_id);
            if (comparison !== 0 && sortBy === 'policyId') {
                return direction === 'asc' ? comparison : -comparison;
            }
        }

        if (sortBy === 'assetName' || (sortBy === 'both' && comparison === 0)) {
            comparison = a.asset_name.localeCompare(b.asset_name);
        }

        return direction === 'asc' ? comparison : -comparison;
    });
};

/**
 * Gets a unique asset identifier by combining policy ID and asset name
 */
export const getAssetIdentifier = (asset: Asset): string => {
    return `${asset.policy_id}.${asset.asset_name}`;
};

/**
 * Extracts the CIP-60 metadata version from an asset
 */
export const getMusicMetadataVersion = (asset: Asset): number | null => {
    try {
        const version = asset.metadata_json?.music_metadata_version;
        return typeof version === 'number' ? version :
            typeof version === 'string' ? parseInt(version, 10) : null;
    } catch (error) {
        return null;
    }
};