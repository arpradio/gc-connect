'use server'

const PINATA_API_URL = 'https://api.pinata.cloud';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToPinata(formData: FormData) {
  const file = formData.get('file') as File;
  const apiKey = formData.get('apiKey') as string;
  const apiSecret = formData.get('apiSecret') as string;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials are required');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 100MB limit');
  }

  try {
    const buffer = await file.arrayBuffer();
    const fileBlob = new Blob([buffer]);

    const pinataFormData = new FormData();
    pinataFormData.append('file', fileBlob, file.name);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
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
      timestamp: result.Timestamp
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    };
  }
}

export async function verifyPinataCredentials(apiKey: string, apiSecret: string) {
  try {
    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify credentials' 
    };
  }
}