import { ChangeEvent } from 'react';

interface RightsSectionProps {
    isrc: string;
    iswc: string;
    recordingOwner: string;
    compositionOwner: string;
    isAIGenerated: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  }
  
  export const RightsSection = ({ 
    isrc, 
    iswc, 
    recordingOwner, 
    compositionOwner, 
    isAIGenerated, 
    onChange 
  }: RightsSectionProps) => (
    <div className="space-y-4">
      <div className="flex justify-evenly mx-auto">
        <div>
          <label htmlFor="isrc" className="block text-sm font-medium text-white">
            ISRC
          </label>
          <input
            type="text"
            id="isrc"
            name="isrc"
            value={isrc}
            onChange={onChange}
            className="mt-1 block text-sm rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="iswc" className="block text-sm font-medium text-white">
            ISWC
          </label>
          <input
            type="text"
            id="iswc"
            name="iswc"
            value={iswc}
            onChange={onChange}
            disabled={isAIGenerated}
            className="mt-1 block w-full rounded-md text-sm border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex justify-evenly mx-auto">
        <div>
          <label htmlFor="recordingOwner" className="block text-sm font-medium text-white">
            Recording Owner*
          </label>
          <input
            type="text"
            id="recordingOwner"
            name="recordingOwner"
            value={recordingOwner}
            placeholder="Enter Year and Owner Name"
            onChange={onChange}
            required
            className="mt-1 block px-4 rounded-md border-gray-600 bg-gray-700 text-white text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="compositionOwner" className="block text-sm font-medium text-white">
            Composition Owner*
          </label>
          <input
            type="text"
            id="compositionOwner"
            name="compositionOwner"
            value={compositionOwner}
            placeholder="Enter Year and Owner Name"
            onChange={onChange}
            required
            disabled={isAIGenerated}
            className="mt-1 block rounded-md text-sm border-gray-600 bg-gray-700 px-4 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );