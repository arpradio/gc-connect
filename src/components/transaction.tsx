import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface TransactionComponentProps {
  isWalletConnected: boolean;
  walletAddress: string;
}

const TransactionComponent: React.FC<TransactionComponentProps> = ({ 
  isWalletConnected, 
  walletAddress 
}) => {
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [metadata, setMetadata] = useState<string>('');
  const [txModalOpen, setTxModalOpen] = useState<boolean>(false);
  const [txUrl, setTxUrl] = useState<string>('');
  const [txStatus, setTxStatus] = useState<'success' | 'error' | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  
  const validateForm = (): boolean => {
    if (!recipient) {
      setValidationError('Recipient address is required');
      return false;
    }
    
    if (!recipient.startsWith('addr1')) {
      setValidationError('Invalid Cardano address format');
      return false;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setValidationError('Amount must be a positive number');
      return false;
    }
    
    if (parseFloat(amount) < 1) {
      setValidationError('Minimum amount is 1 ADA');
      return false;
    }
    
    setValidationError('');
    return true;
  };
  
  const adaToLovelace = (ada: string): string => {

    const parsedAmount = parseFloat(ada);
    if (isNaN(parsedAmount)) return "0";

    const lovelace = Math.round(parsedAmount * 1000000);
    return lovelace.toString();
  };
  
  const sendTransaction = async (): Promise<void> => {
    if (!isWalletConnected) {
      setValidationError('Wallet not connected');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    setTxStatus(null);
    setTxHash('');
    
    try {
      const lovelaceAmount = adaToLovelace(amount);
      
      const txScript: {
        type: string;
        title: string;
        description: string;
        exportAs: string;
        return: { mode: string };
        returnURLPattern: string;
        run: Record<string, unknown>;
      } = {
        type: "script",
        title: "Send ADA",
        description: `Send ${amount} ADA to ${recipient}`,
        exportAs: "SendTransaction",
        return: {
          mode: "last"
        },
        returnURLPattern: window.location.origin + window.location.pathname,
        run: {
          stage1_build_transaction: {
            type: "buildTx",
            title: "Send ADA Transaction",
            description: `Sending ${amount} ADA to ${recipient}`,
            name: "Unsigned Transaction",
            tx: {
              outputs: [
                {
                  address: recipient,
                  assets: [
                    {
                      policyId: "ada",
                      assetName: "ada",
                      quantity: lovelaceAmount
                    }
                  ]
                }
              ],
              auxiliaryData: metadata ? {
                "674": {
                  msg: metadata
                }
              } : undefined
            }
          },
          stage2_sign_transaction: {
            type: "signTxs",
            namePattern: "Signed Transaction",
            detailedPermissions: false,
            txs: [
              "{get('cache.stage1_build_transaction.txHex')}"
            ]
          },
          stage3_submit_transaction: {
            type: "submitTxs",
            namePattern: "Submitted Transaction",
            txs: "{get('cache.stage2_sign_transaction')}"
          },
          stage4_export_results: {
            type: "macro",
            run: "{get('cache.stage3_submit_transaction')}"
          }
        }
      };
      
      if (typeof window !== 'undefined' && window.gc) {
        const url = await window.gc.encode.url({
          input: JSON.stringify(txScript),
          apiVersion: "2",
          network: "mainnet",
          encoding: "gzip"
        });
        
        setTxUrl(url);
        setTxModalOpen(true);
      } else {
        throw new Error('GameChanger Wallet library not loaded');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTransactionResponse = async (responseData: string): Promise<boolean> => {
    try {
      setIsProcessing(true);
      
      if (typeof window !== 'undefined' && window.gc) {
        const resultObj = await window.gc.encodings.msg.decoder(responseData);
        console.log('Transaction response:', resultObj);
        
        if (resultObj.exports?.SendTransaction) {
          const txHash = Array.isArray(resultObj.exports.SendTransaction) 
            ? resultObj.exports.SendTransaction[0] 
            : resultObj.exports.SendTransaction;
            
          if (txHash) {
            setTxHash(typeof txHash === 'string' ? txHash : String(txHash));
            setTxStatus('success');
            return true;
          }
        }
        
        if (resultObj.error) {
          setTxStatus('error');
          setValidationError(resultObj.error.message || 'Transaction failed');
          return false;
        }
        
        setTxStatus('error');
        setValidationError('Unknown transaction response format');
        return false;
      } else {
        throw new Error('GameChanger Wallet library not loaded');
      }
    } catch (error) {
      console.error('Error processing transaction response:', error);
      setTxStatus('error');
      setValidationError(error instanceof Error ? error.message : 'Failed to process transaction response');
      return false;
    } finally {
      setIsProcessing(false);
      setTxModalOpen(false);
    }
  };
  
  const openTxInSameWindow = (): void => {
    if (txUrl) {
      window.location.href = txUrl;
    }
  };
  
  const copyTxHash = async (): Promise<void> => {
    if (txHash) {
      try {
        await navigator.clipboard.writeText(txHash);
      } catch (err) {
        console.error('Failed to copy transaction hash', err);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-xl text-white">Send ADA</CardTitle>
          <CardDescription className="text-neutral-400">
            Create and submit transactions using GameChanger Wallet
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isWalletConnected ? (
            <Alert className="bg-amber-900/20 border-amber-700/30 text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet first to create transactions
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {validationError && (
                <Alert className="bg-red-900/20 border-red-700/30 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              
              {txStatus === 'success' && (
                <Alert className="bg-green-900/20 border-green-700/30 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Transaction submitted successfully!
                    <div className="mt-2 flex items-center space-x-2">
                      <code className="text-xs bg-black/30 p-1 rounded font-mono">{txHash}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
                        onClick={copyTxHash}
                      >
                        <Copy size={14} />
                      </Button>
                      <a
                        href={`https://cardanoscan.io/transaction/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 inline-flex items-center text-xs"
                      >
                        View on Explorer
                        <ExternalLink size={10} className="ml-1" />
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Recipient Address
                  </label>
                  <Input
                    placeholder="addr1..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Amount (ADA)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Metadata Message (Optional)
                  </label>
                  <Input
                    placeholder="Message to include in transaction metadata"
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={sendTransaction}
            disabled={!isWalletConnected || isProcessing}
            className="bg-amber-500 hover:bg-amber-600 text-white w-full"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span>Send Transaction</span>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={txModalOpen} onOpenChange={setTxModalOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Complete Transaction in Wallet</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Review and sign your transaction in GameChanger Wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-4 rounded-lg" id="tx-qrcode-container">

              {txUrl && (
                <div className="bg-neutral-800 p-3 rounded-lg max-w-xs overflow-hidden text-xs text-neutral-300 break-all">
                  {txUrl}
                </div>
              )}
            </div>
            
            <Button
              onClick={openTxInSameWindow}
              className="bg-amber-500 hover:bg-amber-600 text-white w-full"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Open GameChanger Wallet
            </Button>
          </div>
          
          <div className="text-center text-xs text-neutral-500">
            Once you complete the transaction, you will be redirected back to this application
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionComponent;