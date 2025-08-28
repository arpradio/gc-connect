// src/lib/signature-verifier.ts
import crypto from 'crypto';
import cbor from 'cbor';

interface ConnectionData {
  data?: {
    address: string;
    name?: string;
    addressInfo?: {
      networkId?: number;
      isBase?: boolean;
      isEnterprise?: boolean;
      isReward?: boolean;
    };
    [key: string]: any;
  };
  hash?: string;
  sign?: {
    signature: string;
    key: string;
  };
}

// ✅ EXPORTED: Basic validation function
export function validateWalletData(connectionData: any): boolean {
  try {
    if (!connectionData || !connectionData.data || !connectionData.data.address) {
      console.error("Wallet data validation failed: missing required fields", {
        hasConnectionData: !!connectionData,
        hasData: !!connectionData?.data,
        hasAddress: !!connectionData?.data?.address
      });
      return false;
    }
    
    // Additional validation for GameChanger structure
    if (!connectionData.hash || !connectionData.sign) {
      console.error("Wallet data validation failed: missing hash or signature", {
        hasHash: !!connectionData.hash,
        hasSign: !!connectionData.sign,
        hasSignature: !!connectionData.sign?.signature,
        hasKey: !!connectionData.sign?.key
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
}

// Helper function for safe value retrieval from COSE structures
function getValueSafely(obj: any, key: string | number): any {
  if (!obj) return undefined;
  
  if (typeof obj.get === 'function') {
    return obj.get(key);
  } else if (typeof obj === 'object') {
    return obj[key];
  }
  
  return undefined;
}

// ✅ EXPORTED: Main CIP-8 signature verification function
export async function verifyCIP8Signature(connectionData: ConnectionData): Promise<boolean> {
  try {
    if (!connectionData?.sign?.signature || !connectionData?.sign?.key || !connectionData?.hash) {
      console.error('Missing required signature data');
      return false;
    }

    console.log("Starting CIP-8 verification...");

    const signatureBytes = Buffer.from(connectionData.sign.signature, 'hex');
    let coseSign1;
    
    try {
      coseSign1 = cbor.decode(signatureBytes);
    } catch (error) {
      console.error('Failed to decode COSE_Sign1 structure:', error);
      return false;
    }

    if (!Array.isArray(coseSign1) || coseSign1.length !== 4) {
      console.error('Invalid COSE_Sign1 structure, expected array of length 4, got:', typeof coseSign1, Array.isArray(coseSign1) ? coseSign1.length : 'not array');
      return false;
    }
    
    const [protectedHeadersBytes, unprotectedHeaders, payload, signature] = coseSign1;

    const expectedHash = Buffer.from(connectionData.hash, 'hex');
    
    console.log("COSE structure parsed:", {
      protectedHeadersLength: Buffer.isBuffer(protectedHeadersBytes) ? protectedHeadersBytes.length : 'not buffer',
      payloadType: typeof payload,
      payloadIsNull: payload === null,
      payloadLength: payload ? (Buffer.isBuffer(payload) ? payload.length : 'not buffer') : 'null',
      signatureLength: Buffer.isBuffer(signature) ? signature.length : 'not buffer',
      expectedHashLength: expectedHash.length
    });

    // Decode protected headers
    let protectedHeaders;
    try {
      protectedHeaders = cbor.decode(protectedHeadersBytes);
    } catch (error) {
      console.error('Failed to decode protected headers:', error);
      return false;
    }
    
    // Check hashed flag
    const hashedValue = getValueSafely(unprotectedHeaders, 'hashed');
    const isHashed = hashedValue === true;
    
    console.log("Payload analysis:", {
      isHashed,
      payloadIsNull: payload === null,
      payloadEqualsHash: payload ? payload.equals(expectedHash) : 'payload_null'
    });
    
    // For GameChanger, payload might be null, use expectedHash
    let sigPayload = payload;
    if (payload === null || (Buffer.isBuffer(payload) && payload.length === 0)) {
      console.log("Using expected hash as payload (GameChanger pattern)");
      sigPayload = expectedHash;
    } else if (Buffer.isBuffer(payload) && !payload.equals(expectedHash)) {
      console.error('Payload does not match expected hash');
      return false;
    }
    
    // Decode and validate COSE key
    const keyBytes = Buffer.from(connectionData.sign.key, 'hex');
    let coseKey;
    
    try {
      coseKey = cbor.decode(keyBytes);
    } catch (error) {
      console.error('Failed to decode COSE key:', error);
      return false;
    }

    // Validate key type (must be OKP = 1)
    if (getValueSafely(coseKey, 1) !== 1) {
      console.error('Key is not an Octet Key Pair type');
      return false;
    }
    
    // Validate curve (must be Ed25519 = 6)
    const crvKey = -1; 
    const xKey = -2;   
    
    const hasCrvKey = coseKey.has ? coseKey.has(crvKey) : crvKey in coseKey;
    const crvValue = getValueSafely(coseKey, crvKey);
    
    if (!hasCrvKey || crvValue !== 6) { 
      console.error('Key is not an Ed25519 curve, got:', crvValue);
      return false;
    }
    
    // Extract public key
    const hasXKey = coseKey.has ? coseKey.has(xKey) : xKey in coseKey;
    if (!hasXKey) {
      console.error('Missing X coordinate in key');
      return false;
    }
    
    const publicKeyRaw = getValueSafely(coseKey, xKey);
    
    if (!Buffer.isBuffer(publicKeyRaw) || publicKeyRaw.length !== 32) {
      console.error('Invalid public key length:', publicKeyRaw ? publicKeyRaw.length : 'not buffer');
      return false;
    }
    
    console.log("Key validation passed:", {
      publicKeyLength: publicKeyRaw.length,
      keyType: 'Ed25519'
    });
    
    // Construct Sig_structure for verification
    const sigStructure = [
      'Signature1',        
      protectedHeadersBytes, 
      Buffer.alloc(0),      
      sigPayload              
    ];
    
    const sigStructureEncoded = cbor.encode(sigStructure);
    
    console.log("Signature structure:", {
      sigStructureLength: sigStructureEncoded.length,
      sigPayloadLength: sigPayload.length
    });
    
    // Verify signature using Node.js crypto
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
      
      console.log('CIP-8 signature verification result:', verified);
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

// ✅ EXPORTED: Main validation function used by API
export async function validateWalletConnection(
  connectionData: ConnectionData,
  message?: string
): Promise<{ 
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

    console.log("Validating wallet connection:", {
      hasAddress: !!connectionData.data.address,
      hasHash: !!connectionData.hash,
      hasSignature: !!connectionData.sign.signature,
      hasKey: !!connectionData.sign.key,
      addressPreview: connectionData.data.address.substring(0, 8) + '...'
    });

    const isValid = await verifyCIP8Signature(connectionData);
    
    const result = { 
      isValid, 
      message: isValid ? "Signature verified successfully" : "Invalid signature",
      environment: typeof process !== 'undefined' ? process.env.NODE_ENV : 'client',
      walletName: connectionData.data?.name,
      networkId: connectionData.data?.addressInfo?.networkId
    };

    console.log("Validation completed:", result);
    return result;
    
  } catch (error) {
    console.error("Signature validation error:", error);
    return { 
      isValid: false, 
      message: error instanceof Error ? error.message : "Unknown validation error",
      environment: typeof process !== 'undefined' ? process.env.NODE_ENV : 'client'
    };
  }
}

// ✅ EXPORTED: Legacy compatibility (if needed)
export { verifyCIP8Signature as verifyCIP8 };

// ✅ DEFAULT EXPORT for backward compatibility
export default {
  validateWalletData,
  validateWalletConnection,
  verifyCIP8Signature
};