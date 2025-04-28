import { getIPFSUrl } from '@/actions/ipfs';

export type ImageSource = string | null | undefined;

const ipfsCache = new Map<string, string>();

const isIPFSUrl = (src: string): boolean => {
  return (
    src.startsWith('ipfs://') ||
    /^Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(src) ||
    /^bafy[a-zA-Z0-9]{44,}/.test(src) ||
    src.includes('.ipfs.')
  );
};

export const extractImage = async (metadata: any): Promise<string> => {
  const image = metadata?.image || metadata?.files?.[0]?.src;

  if (!image) return '/default.png';

  if (typeof image === 'string') {
    if (image.startsWith('data:')) {
      return image;
    }


    if (ipfsCache.has(image)) {
      return ipfsCache.get(image)!;
    }

    try {
      const timeout = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('IPFS URL resolution timeout')), 5000)
      );

      const url = await Promise.race([getIPFSUrl(image), timeout]);
      ipfsCache.set(image, url);
      return url;
    } catch (error) {
      console.error('Error getting IPFS URL:', error);
      return '/default.png';
    }
  }

  if (Array.isArray(image)) {
    const combinedImage = image.join("");

    if (ipfsCache.has(combinedImage)) {
      return ipfsCache.get(combinedImage)!;
    }

    try {
      const url = await getIPFSUrl(combinedImage);
      ipfsCache.set(combinedImage, url);
      return url;
    } catch (error) {
      console.error('Error getting IPFS URL:', error);
      return '/default.png';
    }
  }

  return '/default.png';
};

export const normalizeImageSrc = async (src: ImageSource): Promise<string> => {
  if (!src || typeof src !== 'string') return '/default.png';

  if (src.startsWith('data:')) {
    return src;
  }

  if (ipfsCache.has(src)) {
    return ipfsCache.get(src)!;
  }

  try {
    const url = await getIPFSUrl(src);
    ipfsCache.set(src, url);
    return url;
  } catch (error) {
    console.error('Error normalizing image source:', error);
    return '/default.png';
  }
};

export const extractImageWithCallback = (
  metadata: any,
  callback: (url: string) => void
): string => {
  const image = metadata?.image || metadata?.files?.[0]?.src;

  if (!image) return '/default.png';

  if (typeof image === 'string') {
    if (image.startsWith('data:')) {
      return image;
    }

    if (ipfsCache.has(image)) {
      const cachedUrl = ipfsCache.get(image)!;
      setTimeout(() => callback(cachedUrl), 0);
      return cachedUrl;
    }

    const immediateDisplay = isIPFSUrl(image) ?
      `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}` :
      '/default.png';

    getIPFSUrl(image)
      .then(url => {
        ipfsCache.set(image, url);
        callback(url);
      })
      .catch(error => {
        console.error('Error getting IPFS URL:', error);
        callback('/default.png');
      });

    return immediateDisplay;
  }

  if (Array.isArray(image)) {
    const combinedImage = image.join("");

    if (ipfsCache.has(combinedImage)) {
      const cachedUrl = ipfsCache.get(combinedImage)!;
      setTimeout(() => callback(cachedUrl), 0);
      return cachedUrl;
    }

    getIPFSUrl(combinedImage)
      .then(url => {
        ipfsCache.set(combinedImage, url);
        callback(url);
      })
      .catch(error => {
        console.error('Error getting IPFS URL:', error);
        callback('/default.png');
      });

    return '/default.png';
  }

  return '/default.png';
};

export const normalizeImageSrcWithCallback = (
  src: ImageSource,
  callback: (url: string) => void
): string => {
  if (!src || typeof src !== 'string') return '/default.png';

  if (src.startsWith('data:')) {
    return src;
  }

  if (ipfsCache.has(src)) {
    const cachedUrl = ipfsCache.get(src)!;
    setTimeout(() => callback(cachedUrl), 0);
    return cachedUrl;
  }

  const immediateDisplay = isIPFSUrl(src) ?
    `https://ipfs.io/ipfs/${src.replace('ipfs://', '')}` :
    '/default.png';

  getIPFSUrl(src)
    .then(url => {
      ipfsCache.set(src, url);
      callback(url);
    })
    .catch(error => {
      console.error('Error normalizing image source:', error);
      callback('/default.png');
    });

  return immediateDisplay;
};