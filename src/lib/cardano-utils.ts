export type HexString = string;
export type Lovelace = string;
export type ADA = number;
export type AssetFingerprint = string;
export type PolicyId = string;
export type AssetName = string;
export type AssetId = string;

export const lovelaceToAda = (lovelace: Lovelace | number): ADA =>
  (typeof lovelace === 'string' ? parseInt(lovelace, 10) : lovelace) / 1_000_000;

export const adaToLovelace = (ada: ADA): bigint =>
  BigInt(Math.round(ada * 1_000_000));

export const formatAda = (amount: ADA | undefined, options?: { decimals?: number, symbol?: boolean }): string => {
  if (amount === undefined) return '0 ₳';

  const decimals = options?.decimals ?? 2;
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  };

  const formattedAmount = amount.toLocaleString(undefined, formatOptions);
  return options?.symbol === false ? formattedAmount : `${formattedAmount} ₳`;
};

export const hexToUtf8 = (hex: HexString): string => {
  try {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return hex;
  }
};

export const utf8ToHex = (text: string): HexString => {
  return Array.from(new TextEncoder().encode(text))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const truncateId = (
  id: string,
  options?: { start?: number, end?: number }
): string => {
  const start = options?.start ?? 8;
  const end = options?.end ?? 8;

  if (!id || id.length <= start + end) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

export const decodeAssetName = (assetNameHex: HexString): string => {
  try {
    const name = hexToUtf8(assetNameHex);
    const isPrintable = /^[\x20-\x7E]*$/.test(name);
    return isPrintable ? name : assetNameHex;
  } catch {
    return assetNameHex;
  }
};

export const getAssetFingerprint = (policyId: PolicyId, assetName: AssetName): AssetFingerprint =>
  `asset1${policyId.slice(0, 8)}${assetName.slice(0, 8)}`;

export const extractMetadataField = <T>(
  metadata: Record<string, unknown> | undefined,
  ...possibleKeys: string[]
): T | undefined => {
  if (!metadata) return undefined;

  for (const key of possibleKeys) {
    if (metadata[key] !== undefined) {
      return metadata[key] as T;
    }

    const lowerKey = key.toLowerCase();
    for (const metaKey of Object.keys(metadata)) {
      if (metaKey.toLowerCase() === lowerKey) {
        return metadata[metaKey] as T;
      }
    }

    for (const metaKey of Object.keys(metadata)) {
      const nestedObj = metadata[metaKey];
      if (nestedObj && typeof nestedObj === 'object' && (nestedObj as Record<string, unknown>)[key] !== undefined) {
        return (nestedObj as Record<string, unknown>)[key] as T;
      }
    }
  }

  return undefined;
};