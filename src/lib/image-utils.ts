import { getIPFSUrl } from '@/app/utils/ipfs';

export type ImageSource = string | null | undefined;

export const extractImage = (metadata: any): string => {
  const image = metadata.image || metadata.files?.[0]?.src;

  if (!image) return '/default.png';

  if (typeof image === 'string') {
    if (image.startsWith('data:')) {
      return image;
    }
    return getIPFSUrl(image);
  }

  if (Array.isArray(image)) {
    const combinedImage = image.join("");
    return getIPFSUrl(combinedImage);
  }

  return '/default.png';
};

export const normalizeImageSrc = (src: ImageSource): string => {
  if (!src || typeof src !== 'string') return '/default.png';

  if (src.startsWith('data:')) {
    return src;
  }

  return getIPFSUrl(src);
};