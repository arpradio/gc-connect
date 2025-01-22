import React, { useState } from 'react';
import { Loader2, X, Upload, CheckCircle2 } from 'lucide-react';
import { uploadToPinata, verifyPinataCredentials } from '@/actions/ipfs';
import { PinataResponse } from '@/types/index';

interface PinataModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onUploadSuccess: (cid: string) => void;
}

export function PinataModal({ isOpen, onClose, file, onUploadSuccess }: PinataModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingCredentials, setVerifyingCredentials] = useState(false);
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  if (!isOpen || !file) return null;

  const handleVerifyCredentials = async () => {
    if (!apiKey || !apiSecret) {
      setError('Please provide both API key and secret');
      return;
    }

    setVerifyingCredentials(true);
    setError(null);

    const result = await verifyPinataCredentials(apiKey, apiSecret);

    if (result.success) {
      setCredentialsVerified(true);
      setError(null);
    } else {
      setError('Invalid credentials');
      setCredentialsVerified(false);
    }

    setVerifyingCredentials(false);
  };

  const handleUpload = async () => {
    if (!file || !apiKey || !apiSecret) {
      setError('Please provide file and credentials');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', apiKey);
      formData.append('apiSecret', apiSecret);

      const result = await uploadToPinata(formData) as PinataResponse;

      if (result.success && result.cid) {
        setUploadProgress(100);
        setUploadStatus('Upload complete!');
        onUploadSuccess(result.cid);
        setTimeout(onClose, 1500);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center text-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full space-y-4  border-white border-[3px]">
      <div className="flex flex-end "><button
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-auto"
            disabled={isUploading}
          ><div className="text-[.3rem] m-auto w-fit">Close/Skip Pinning</div>
            <X size={24} />
          </button></div>
      <h1 className=" text-center mb-4 text-xl font-bold text-amber-300">Would you like to pin your file?</h1>
        
           
          <a href="https://docs.pinata.cloud/account-management/api-keys" target="_blank" rel="noopener noreferrer">
            <div className="mt-4 italic text-md  text-white hover:text-blue-400 mb-1">
              Click Here to Learn How to Upload to Pinata IPFS
            </div></a>
            <a className="text-purple-600 text-sm hover:text-amber-400" href="https://app.pinata.cloud/" target="_blank"><div className="border-2 w-fit  px-2 rounded-lg bg-amber-300 m-auto">Get your free Pinata account here!</div></a>
          
          <div >
    
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-300">
            Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Pinata API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isUploading || credentialsVerified}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              placeholder="Enter your Pinata API key"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Pinata API Secret</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              disabled={isUploading || credentialsVerified}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              placeholder="Enter your Pinata API secret"
            />
          </div>

          {!credentialsVerified ? (
            <button
              onClick={handleVerifyCredentials}
              disabled={!apiKey || !apiSecret || verifyingCredentials}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
            >
              {verifyingCredentials ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Verify Credentials
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={isUploading || !credentialsVerified}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {uploadStatus}
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload to IPFS
                </>
              )}
            </button>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-300 text-center">
                {uploadStatus}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}