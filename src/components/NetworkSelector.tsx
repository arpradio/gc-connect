'use client';

import { useState } from "react";

interface NetworkSelectorProps {
  selectedNetwork: 'preprod' | 'mainnet';
  onNetworkChange: (network: 'preprod' | 'mainnet') => void;
}

export default function NetworkSelector({ selectedNetwork, onNetworkChange }: NetworkSelectorProps) {
  return (
    <div className=" items-center justify-center gap-2 p-2">
      <div className="flex items-center justify-center"> <label
        htmlFor="network"
        className="text-white font-medium"
      >
        Network Select:
      </label>
        <select
          id="network"
          value={selectedNetwork}
          onChange={(e) => onNetworkChange(e.target.value as 'preprod' | 'mainnet')}
          className="px-1 mx-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer transition-colors hover:bg-gray-600"
        >
          <option value="preprod">Preprod</option>
          <option value="mainnet">Mainnet</option>
        </select>

        <div
          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedNetwork === 'mainnet'
              ? 'bg-green-600 text-white'
              : 'bg-yellow-600 text-white'
            }`}
        >
          {selectedNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}

        </div></div>
      {selectedNetwork === 'mainnet' && (

        <div className=" text-center  mt-1  mx-auto text-yellow-500 text-sm">
          ⚠️ You are on Mainnet. Transactions will require real ADA.

        </div>


      )}
    </div>

  );
}


export type Network = 'preprod' | 'mainnet';

export function useNetwork() {
  const [network, setNetwork] = useState<Network>('preprod');

  const handleNetworkChange = (newNetwork: Network) => {
    setNetwork(newNetwork);

  };

  return {
    network,
    setNetwork: handleNetworkChange,
  };
}