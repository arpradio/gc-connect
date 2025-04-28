import { getIPFSUrl } from '@/app/utils/ipfs-utils';

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
}

export function parseAssetMetadata(asset: any): AssetMetadata {
    const metadata = asset?.metadata_json || {};
    const result: AssetMetadata = {
        name: '',       
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
    } catch (error) {
        console.error('Error parsing asset metadata:', error);
    }

    return result;
}

export function getIPFSImageUrl(src: string | undefined | null): string {
    if (!src || typeof src !== 'string') return '/default.png';
    
    return getIPFSUrl(src);
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