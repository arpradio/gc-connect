import crypto from 'crypto';
import cbor from 'cbor';

interface ConnectionData {
  data?: {
    address: string;
    name?: string;
    [key: string]: any;
  };
  hash?: string;
  sign?: {
    signature: string;
    key: string;
  };
}

export function validateWalletData(connectionData: any): boolean {
  try {
    if (!connectionData || !connectionData.data || !connectionData.data.address) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
}

export async function validateWalletConnection(connectionData: ConnectionData): Promise<{ 
  isValid: boolean; 
  message: string;
  environment?: string;
  walletName?: string;
  networkId?: number;
}> {
  try {
    if (!connectionData.data?.address || !connectionData.hash || !connectionData.sign) {
      return { isValid: false, message: "Missing required connection data" };
    }

    const isValid = await verifyCIP8Signature(connectionData);
    
    return { 
      isValid, 
      message: isValid ? "Signature verified successfully" : "Invalid signature",
      environment: typeof process !== 'undefined' ? process.env.NODE_ENV : 'client',
      walletName: connectionData.data?.name,
      networkId: connectionData.data?.addressInfo?.networkId
    };
  } catch (error) {
    console.error("Signature validation error:", error);
    return { 
      isValid: false, 
      message: error instanceof Error ? error.message : "Unknown validation error",
      environment: typeof process !== 'undefined' ? process.env.NODE_ENV : 'client'
    };
  }
}


function getValueSafely(obj: any, key: string | number): any {
  if (!obj) return undefined;
  
  if (typeof obj.get === 'function') {
    return obj.get(key);
  } else if (typeof obj === 'object') {
    return obj[key];
  }
  
  return undefined;
}


export async function verifyCIP8Signature(connectionData: ConnectionData): Promise<boolean> {
  try {
    if (!connectionData?.sign?.signature || !connectionData?.sign?.key || !connectionData?.hash) {
      console.error('Missing required signature data');
      return false;
    }

    const signatureBytes = Buffer.from(connectionData.sign.signature, 'hex');
    let coseSign1;
    
    try {
      coseSign1 = cbor.decode(signatureBytes);
    } catch (error) {
      console.error('Failed to decode COSE_Sign1 structure:', error);
      return false;
    }

    if (!Array.isArray(coseSign1) || coseSign1.length !== 4) {
      console.error('Invalid COSE_Sign1 structure, expected array of length 4');
      return false;
    }
    
    const [protectedHeadersBytes, unprotectedHeaders, payload, signature] = coseSign1;

    const expectedHash = Buffer.from(connectionData.hash, 'hex');
    
    if (!Buffer.isBuffer(payload)) {
      console.error('Payload is not a byte buffer');
      return false;
    }
    
    if (!payload.equals(expectedHash)) {
      console.error('Payload does not match expected hash');
      return false;
    }

    let protectedHeaders;
    try {
      protectedHeaders = cbor.decode(protectedHeadersBytes);
    } catch (error) {
      console.error('Failed to decode protected headers:', error);
      return false;
    }
    
    const hashedValue = getValueSafely(unprotectedHeaders, 'hashed');
    const isHashed = hashedValue === true;
    
    if (isHashed) {
      console.log('Message is using hashed payload (Blake2b-224)');
    }
    
   
    const addressKey = 'address'; 
    const addressBytes = getValueSafely(protectedHeaders, addressKey);
    
    if (!addressBytes) {
      console.error('Missing address in protected headers');
      return false;
    }
    
   
    const keyBytes = Buffer.from(connectionData.sign.key, 'hex');
    let coseKey;
    
    try {
      coseKey = cbor.decode(keyBytes);
    } catch (error) {
      console.error('Failed to decode COSE key:', error);
      return false;
    }

    if (getValueSafely(coseKey, 1) !== 1) {
      console.error('Key is not an Octet Key Pair type');
      return false;
    }
    
    const crvKey = -1; 
    const xKey = -2;   
    
    const hasCrvKey = coseKey.has ? coseKey.has(crvKey) : crvKey in coseKey;
    const crvValue = getValueSafely(coseKey, crvKey);
    
    if (!hasCrvKey || crvValue !== 6) { 
      console.error('Key is not an Ed25519 curve');
      return false;
    }
    
    const hasXKey = coseKey.has ? coseKey.has(xKey) : xKey in coseKey;
    if (!hasXKey) {
      console.error('Missing X coordinate in key');
      return false;
    }
    
    const publicKeyRaw = getValueSafely(coseKey, xKey);
    
    const sigStructure = [
      'Signature1',        
      protectedHeadersBytes, 
      Buffer.alloc(0),      
      payload              
    ];
    
    const sigStructureEncoded = cbor.encode(sigStructure);
    
   
    try {
      const publicKeyWithHeader = Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'), 
        publicKeyRaw
      ]);
      
      const publicKey = crypto.createPublicKey({
        key: publicKeyWithHeader,
        format: 'der',
        type: 'spki',
      });
      
      const verified = crypto.verify(
        null, 
        sigStructureEncoded,
        publicKey,
        signature
      );
      
      console.log('Signature verification result:', verified);
      return verified;
      
    } catch (error) {
      console.error('Error during signature verification:', error);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error in CIP-8 verification:', error);
    return false;
  }
}