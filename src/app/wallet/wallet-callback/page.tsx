"use client"

import { FC, useEffect } from 'react';

const WalletCallback: FC = () => {
  useEffect(() => {
    const handleClose = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const url = new URL(window.location.href);
        const result = url.searchParams.get('result');
        
        if (result) {
          // Set result in localStorage first (as reliable fallback)
          localStorage.setItem('gc_wallet_callback', result);
          
          // Try to message the opener directly if available
          if (window.opener) {
            try {
              // Use structured cloning for better compatibility
              const message = {
                type: 'gc_wallet_callback',
                result: result,
                timestamp: Date.now()
              };
              
              window.opener.postMessage(message, window.location.origin);
              console.log('Direct message sent to opener');
              
              // Dispatch a custom event in the opener window for Firefox
              try {
                if (window.opener.document) {
                  const event = new CustomEvent('walletCallbackReceived', { 
                    detail: { data: result },
                    bubbles: true 
                  });
                  window.opener.document.dispatchEvent(event);
                }
              } catch (eventError) {
                console.warn('Could not dispatch event in opener:', eventError);
              }
              
              // Add a small delay to ensure message is sent before closing
              setTimeout(() => window.close(), 300);
              return;
            } catch (err) {
              console.error('Failed to send message to opener:', err);
            }
          }
          
          // Wait slightly longer before closing to ensure localStorage event can propagate
          setTimeout(() => window.close(), 500);
        } else {
          window.close();
        }
      } catch (error) {
        console.error('Error in callback handler:', error);
        window.close();
      }
    };

    // Execute immediately
    handleClose();
    
    // Also try on load event as backup
    window.addEventListener('load', handleClose);
    return () => window.removeEventListener('load', handleClose);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#1a202c',
      color: 'white',
      padding: '20px',
      textAlign: 'center'
    }}>
      <p>Processing wallet connection...</p>
      <button 
        onClick={() => window.close()}
        style={{
          marginTop: '40px',
          padding: '8px 16px',
          backgroundColor: '#d97706',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Close Window
      </button>
    </div>
  );
};

export default WalletCallback;