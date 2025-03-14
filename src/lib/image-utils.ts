import { getIPFSUrl } from '@/actions/ipfs';

export type ImageSource = string | null | undefined;

// Cache for IPFS URLs to avoid redundant transformations
const ipfsCache = new Map<string, string>();

// Check if URL is already a valid IPFS URL or contains a CID
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
      return image; // Data URLs can be returned immediately
    }

    // Check cache first
    if (ipfsCache.has(image)) {
      return ipfsCache.get(image)!;
    }

    try {
      // For potentially large images, set a timeout
      const timeout = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('IPFS URL resolution timeout')), 5000)
      );

      const url = await Promise.race([getIPFSUrl(image), timeout]);
      ipfsCache.set(image, url); // Cache the result
      return url;
    } catch (error) {
      console.error('Error getting IPFS URL:', error);
      return '/default.png';
    }
  }

  if (Array.isArray(image)) {
    const combinedImage = image.join("");

    // Check cache first
    if (ipfsCache.has(combinedImage)) {
      return ipfsCache.get(combinedImage)!;
    }

    try {
      const url = await getIPFSUrl(combinedImage);
      ipfsCache.set(combinedImage, url); // Cache the result
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

  // Check cache first
  if (ipfsCache.has(src)) {
    return ipfsCache.get(src)!;
  }

  try {
    const url = await getIPFSUrl(src);
    ipfsCache.set(src, url); // Cache the result
    return url;
  } catch (error) {
    console.error('Error normalizing image source:', error);
    return '/default.png';
  }
};

// For components that need immediate values with async updates
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

    // Check cache first
    if (ipfsCache.has(image)) {
      const cachedUrl = ipfsCache.get(image)!;
      // Still call the callback to ensure proper state updates
      setTimeout(() => callback(cachedUrl), 0);
      return cachedUrl;
    }

    // For immediate display, return a best-guess URL if it's already in IPFS format
    const immediateDisplay = isIPFSUrl(image) ?
      `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}` :
      '/default.png';

    // Fetch the actual URL asynchronously
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

    // Check cache first
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

  // Check cache first
  if (ipfsCache.has(src)) {
    const cachedUrl = ipfsCache.get(src)!;
    setTimeout(() => callback(cachedUrl), 0);
    return cachedUrl;
  }

  // For immediate display, return a best-guess URL if it's already in IPFS format
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