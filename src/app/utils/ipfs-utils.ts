export function extractCidFromIpfsUrl(url: string): string | null {
    if (!url) return null;
  
    if (url.startsWith('ipfs://')) {
      const path = url.replace('ipfs://', '');
      return path.split('/')[0]; 
    }
    
  
    if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-zA-Z0-9]{44,})/.test(url)) {
      return url.split('/')[0]; // 
    }
    
    const ipfsDomainMatch = url.match(/([a-zA-Z0-9-_]+)\.ipfs\./i);
    if (ipfsDomainMatch && ipfsDomainMatch[1]) {
      return ipfsDomainMatch[1];
    }
    
    const gatewayMatch = url.match(/\/ipfs\/([a-zA-Z0-9-_]+)/i);
    if (gatewayMatch && gatewayMatch[1]) {
      return gatewayMatch[1];
    }
    
    return null;
  }
  
  export function extractArweaveId(url: string): string | null {
    if (!url) return null;
    
    if (url.startsWith('ar://')) {
      return url.replace('ar://', '');
    }
    
  
    const arweaveMatch = url.match(/(?:arweave\.net|permagate\.io|arweave\.dev)\/([a-zA-Z0-9_-]+)/);
    if (arweaveMatch && arweaveMatch[1]) {
      return arweaveMatch[1];
    }
    
    return null;
  }
  
  export function parseBase64Array(src: unknown): string {
    if (Array.isArray(src) && src.length > 0 && typeof src[0] === 'string') {
      return src.join('');
    }
    return src as string;
  }
  
  export function getIPFSUrl(src: unknown): string {
    if (Array.isArray(src) && src.length > 0 && typeof src[0] === 'string') {
      const joined = parseBase64Array(src);
      if (joined.startsWith('data:')) {
        return joined;
      }
    }
  
    if (!src || (typeof src !== 'string' && !Array.isArray(src))) return '/default.png';
    
    const processedSrc = typeof src === 'string' ? src : parseBase64Array(src);
    
    if (processedSrc.startsWith('data:')) {
      return processedSrc;
    }
    
    if (processedSrc.startsWith('ar://') || 
        processedSrc.includes('permagate.io') || 
        processedSrc.includes('arweave.net') ||
        processedSrc.includes('arweave.dev')) {
      const arId = extractArweaveId(processedSrc);
      if (arId) {
        return `/api/arweave?txId=${arId}`;
      }
    }
    
    const cid = extractCidFromIpfsUrl(processedSrc);
    if (cid) {
      return `/api/ipfs?cid=${cid}`;
    }
    
    return processedSrc;
  }
  
  export function isLikelyImage(src: string): boolean {
    if (!src) return false;
    
    if (src.startsWith('data:image/')) return true;
    
  
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerSrc = src.toLowerCase();
    if (imageExtensions.some(ext => lowerSrc.endsWith(ext))) return true;
    
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    if (audioExtensions.some(ext => lowerSrc.endsWith(ext))) return false;
    
   
    
    return true; 
  }