// First, let's create a GameChanger modal component

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type GameChangerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gcUrl: string;
};

const GameChangerModal: React.FC<GameChangerModalProps> = ({ isOpen, onClose, gcUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-2 mx-auto">
        <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Complete Transaction
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="w-full h-[500px]">
            <iframe 
              src={gcUrl} 
              className="w-full h-full" 
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="GameChanger Script"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameChangerModal;