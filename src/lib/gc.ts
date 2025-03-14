import gc from '@gamechanger-finance/gc';

interface GCParams {
  input: string;
  apiVersion: string;
  network: string;
  encoding: string;
}

export async function generateGameChangerUrl(params: GCParams): Promise<string> {
  try {
    const url = await gc.encode.url(params);
    return url;
  } catch (error) {
    console.error('GameChanger URL generation error:', error);
    throw error;
  }
}