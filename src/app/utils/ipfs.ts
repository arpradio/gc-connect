export const getIPFSUrl = (src: unknown): string => {
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
};

