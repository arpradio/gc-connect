'use server'

const PINATA_API_URL = 'https://api.pinata.cloud';
const IPFS_API_URL = 'http://localhost:5001/api/v0';
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

async function pinToLocalIpfs(
  file: File
): Promise<{ success: boolean; cid?: string; size?: number; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([arrayBuffer]);

    const formData = new FormData();
    formData.append('file', fileBlob, file.name);

    const response = await fetch(`${IPFS_API_URL}/add?pin=true`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add file to IPFS: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    const lines = responseText.trim().split('\n');
    const lastLine = lines[lines.length - 1];

    try {
      const result = JSON.parse(lastLine);
      return {
        success: true,
        cid: result.Hash,
        size: parseInt(result.Size, 10),
      };
    } catch (error) {
      throw new Error(`Failed to parse IPFS response: ${lastLine}`);
    }
  } catch (error) {
    console.error('Error pinning to local IPFS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pin to local IPFS',
    };
  }
}

export async function uploadToIPFS(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File size exceeds 100MB limit' };
  }

  try {
    const localResult = await pinToLocalIpfs(file);

    if (localResult.success && localResult.cid) {
      return {
        success: true,
        cid: localResult.cid,
        size: localResult.size,
        timestamp: new Date().toISOString(),
        source: 'local_ipfs'
      };
    }

    console.log('Local IPFS pinning failed, falling back to Pinata:', localResult.error);
  } catch (error) {
    console.error('Error in local IPFS pinning, falling back to Pinata:', error);
  }

  try {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error('Pinata API credentials not configured in environment variables');
    }

    const buffer = await file.arrayBuffer();
    const fileBlob = new Blob([buffer]);

    const pinataFormData = new FormData();
    pinataFormData.append('file', fileBlob, file.name);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.details || 'Failed to upload to Pinata');
    }

    const result: PinataResponse = await response.json();
    return {
      success: true,
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp,
      source: 'pinata'
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

export async function getIPFSUrl(src: unknown): Promise<string> {
  if (!src || typeof src !== 'string') return '';

  if (src.includes('.ipfs.')) {
    const match = src.match(/^(https?:\/\/)?([a-zA-Z0-9]+)\.ipfs\./);
    if (match && match[2]) {
      return `https://ipfs.io/ipfs/${match[2]}`;
    }
  }

  if (/^[a-zA-Z0-9]+\.ipfs\.localhost/.test(src)) {
    const cid = src.split('.ipfs.localhost')[0];
    return `https://ipfs.io/ipfs/${cid}`;
  }

  if (src.startsWith('ipfs://')) {
    const cid = src.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }

  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(src) || /^bafy[a-zA-Z0-9]{44,}/.test(src)) {
    return `https://ipfs.io/ipfs/${src}`;
  }

  if (src.startsWith('ar://')) {
    return `https://permagate.io/${src.replace('ar://', '')}`;
  }

  return src;
}

export async function fetchIPFSContent(src: string) {
  let url = src;
  let cid = '';

  if (src.includes('.ipfs.')) {
    const match = src.match(/^(https?:\/\/)?([a-zA-Z0-9]+)\.ipfs\./);
    if (match && match[2]) {
      cid = match[2];
    }
  } else if (/^[a-zA-Z0-9]+\.ipfs\.localhost/.test(src)) {
    cid = src.split('.ipfs.localhost')[0];
  } else if (src.startsWith('ipfs://')) {
    cid = src.replace('ipfs://', '');
  } else if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(src) || /^bafy[a-zA-Z0-9]{44,}/.test(src)) {
    cid = src;
  }

  if (cid) {
    try {
      const localUrl = `http://localhost:8080/ipfs/${cid}`;
      const response = await fetch(localUrl, { cache: 'no-store' });
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Local IPFS fetch failed, falling back to public gateway', error);
    }

    url = `https://ipfs.io/ipfs/${cid}`;
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      return await response.blob();
    }
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error('IPFS fetch failed completely', error);
    throw error;
  }
}