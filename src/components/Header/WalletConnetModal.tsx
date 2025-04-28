import React, { FC, useState, useEffect } from 'react';
import { AlertTriangle, BadgePlusIcon, ChevronDown, ChevronUp, Import, LucideUsb, Settings2Icon, Wallet } from 'lucide-react';
import { usePathname } from 'next/navigation';


interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletUrl: string | null;
  inProgress: boolean;
  onConnectSoftWallet: () => void;
  isSessionExpired?: boolean;
}



const WalletConnectModal: FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
  walletUrl,
  inProgress,
  onConnectSoftWallet,
  isSessionExpired
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      if (isSessionExpired) {
        setShowAdvancedOptions(true);
      }
      
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {

      setInitialLoad(true);
    }
  }, [isOpen, isSessionExpired]);

  const pathname = usePathname();
  if (pathname === '/no-auth') return null;
  
  if (!isOpen) return null;

  const openWindow = (url: string) => {
    const width = 420;
    const height = 700;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);
    
    window.open(
      url,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no,status=no,scrollbars=yes,resizable=yes`
    );
  };




  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div 
        className={`bg-gradient-to-b from-zinc-900 to-zinc-900 text-center border border-zinc-700 rounded-xl shadow-xl w-full max-w-sm overflow-hidden transition-all duration-300 ${initialLoad ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        <div className="flex justify-between items-center ">
          <h1 className='text-xl font-semibold mt-4 text-white w-full'>Connect Wallet</h1>
          <button
            onClick={onClose}
            className="hover:text-white p-1.5 rounded-full bg-transparent transition-colors"
            disabled={inProgress}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
       
        {isSessionExpired && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg mx-4 mt-4 p-3 flex items-center gap-2 animate-pulse">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span className="text-red-200 text-sm">Your wallet session has expired. Please reconnect to continue.</span>
          </div>
        )}
        
        <div className="p-6">
  
          <div className="space-y-4">     
            <p className="text-sm text-zinc-300 font-medium">
              {inProgress
                ? "Processing connection. Please wait..."
                : ""}
            </p>

            {(walletUrl || isSessionExpired) && !inProgress && (
              <div className="italic space-y-1">
                <button
                  onClick={onConnectSoftWallet}
                  className="group w-full bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-amber-600 hover:to-amber-700 border border-zinc-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:translate-y-px shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                >
                  <Wallet className="mr-2 h-5 w-5 group-hover:text-amber-200 transition-colors" />
                  <span className="font-medium">Connect Web Wallet</span>
                </button>
               
              </div>
            )}

            {inProgress && (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                <p className="text-xs text-amber-400">Connecting to wallet service...</p>
              </div>
            )}
            
        
              
      
        
 <div className="mt-4 text-sm text-neutral-400">You&apos;ll be redirected to GameChanger Wallet and automatically returned when complete.</div>
<hr className="w-full border-zinc-700"/>

<div className="px-4"> <button 
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`w-fit mx-auto bg-gradient-to-r from-red-500 to-orange-800 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-3 rounded-lg flex items-center justify-between transition-all duration-200 ${showAdvancedOptions ? 'shadow-md' : 'shadow-sm'}`}
            aria-expanded={showAdvancedOptions}
            aria-controls="advanced-options"
          >
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span className=" font-medium px-1">Other Features</span>
      
            </div>
            {showAdvancedOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>        <h2 className="text-xs text-neutral-300  mt-2 italic">Click here to create your wallet or access other features.</h2>
          <div 
          onMouseLeave={() => setShowAdvancedOptions(!showAdvancedOptions)}
            id="advanced-options"
            className={`mt-3 bg-black/40 border border-neutral-600 rounded-lg overflow-hidden transition-all duration-300 ${showAdvancedOptions ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-0'}`}
          > 
            <div className={`p-4 space-y-4 ${showAdvancedOptions ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-3 gap-2 text-amber-500 text-xs">
                <button 
                  onClick={() => openWindow("https://beta-wallet.gamechanger.finance/create")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-800/50 hover:text-amber-300 transition-colors"
                >
                  <BadgePlusIcon size={20} />
                  <span>Create New</span>
                </button>

                <button 
                  onClick={() => openWindow("https://beta-wallet.gamechanger.finance/import/extension")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-800/50 hover:text-amber-300 transition-colors"
                >
                  <Import size={20} />
                  <span>Import CIP-30</span>
                </button>

                <button 
                  onClick={() => openWindow("https://beta-wallet.gamechanger.finance/import/hardware")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-800/50 hover:text-amber-300 transition-colors"
                >
                  <LucideUsb size={20} />
                  <span>Import HW</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-amber-500 text-xs">
                <button 
                  onClick={() => openWindow("https://beta-wallet.gamechanger.finance/import/")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-800/50 hover:text-amber-300 transition-colors"
                >
                  <Import size={20} />
                  <span>Import Other</span>
                </button>
                
                <button 
                  onClick={() => openWindow("https://beta-wallet.gamechanger.finance/discover")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-800/50 hover:text-amber-300 transition-colors"
                >
                  <Settings2Icon size={20} />
                  <span>Settings</span>
                </button>
              </div>
              
              <div className='text-xs text-amber-200 flex items-center'>
                <span className="text-gray-300 mr-2">ℹ️</span> 
                <span>A new window will open to complete the task</span>
             
              </div>
            </div>
          </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;