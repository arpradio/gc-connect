import { ChangeEvent } from 'react';

interface ReleaseDetailsSectionProps {
    releaseTitle: string;
    songTitle: string;
    isAIGenerated: boolean;
    isExplicit: boolean;
    quantity: string;
    producer?: string;
    mixEngineer?: string;
    masteringEngineer?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  }
  
  export const ReleaseDetailsSection = ({
    releaseTitle,
    songTitle,
    isAIGenerated,
    isExplicit,
    quantity,
    producer,
    mixEngineer,
    masteringEngineer,
    onChange
  }: ReleaseDetailsSectionProps) => (
    <div className="space-y-4">
      <div>
        <label htmlFor="releaseTitle" className="block text-sm font-medium text-white">
          Release Title*
        </label>
        <input
          type="text"
          id="releaseTitle"
          name="releaseTitle"
          value={releaseTitle}
          onChange={onChange}
          required
          className="mt-1 block md:w-full lg:w-[20rem] rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 mx-auto"
        />
      </div>
      <div>
        <label htmlFor="songTitle" className="block text-sm font-medium text-white">
          Song Title*
        </label>
        <input
          type="text"
          id="songTitle"
          name="songTitle"
          value={songTitle}
          onChange={onChange}
          required
          className="mt-1 block md:w-full lg:w-[20rem] rounded-md border-gray-600 mx-auto bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="producer" className="block text-sm font-medium text-white">
            Producer
          </label>
          <input
            type="text"
            id="producer"
            name="producer"
            value={producer}
            onChange={onChange}
            className="mt-1 block text-black text-sm rounded-md mx-auto"
          />
        </div>
        <div>
          <label htmlFor="mixEngineer" className="block text-sm font-medium text-white">
            Mix Engineer
          </label>
          <input
            type="text"
            id="mixEngineer"
            name="mixEngineer"
            value={mixEngineer}
            onChange={onChange}
            className="mt-1 block text-black text-sm rounded-md mx-auto"
          />
        </div>
        <div>
          <label htmlFor="masteringEngineer" className="block text-sm font-medium text-white">
            Mastering Engineer
          </label>
          <input
            type="text"
            id="masteringEngineer"
            name="masteringEngineer"
            value={masteringEngineer}
            onChange={onChange}
            className="mt-1 block text-black text-sm rounded-md mx-auto"
          />
        </div>
      </div>
      <div className="flex justify-evenly">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isAIGenerated"
              checked={isAIGenerated}
              onChange={onChange}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">AI Generated</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isExplicit"
              checked={isExplicit}
              onChange={onChange}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">Explicit Content</span>
          </label>
        </div>
      </div>
      <div className="m-auto">
        <label htmlFor="quantity" className="block text-sm font-medium text-white">
          Token Quantity*
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={quantity}
          onChange={onChange}
          min="1"
          required
          className="mt-1 block w-24 rounded-md mx-auto border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );