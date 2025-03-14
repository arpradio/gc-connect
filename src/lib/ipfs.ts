import * as IpfsOnlyHash from 'ipfs-only-hash';

export async function calculateCID(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const cid = await IpfsOnlyHash.of(uint8Array);
    return cid;
  } catch (error) {
    console.error('Error calculating CID:', error);
    throw error;
  }
}

