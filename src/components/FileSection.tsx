import { ChangeEvent } from 'react';

interface FileSectionProps {
  songFile?: File;
  coverArtFile?: File;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const FileSection = ({ songFile, coverArtFile, onFileChange }: FileSectionProps) => (
  <div className="flex justify-evenly bg-black pt-2 pb-4 rounded-xl border-[1px] border-color-silver">
    <div>
      <label htmlFor="songFile" className="block text-sm font-medium text-white">
        Song File* {songFile?.name && '(Selected)'}
      </label>
      <input
        type="file"
        id="songFile"
        name="songFile"
        onChange={onFileChange}
        accept="audio/*"
        required
        className="block w-full text-white mx-auto"
      />
    </div>
    <div>
      <label htmlFor="coverArtFile" className="block text-sm font-medium text-white">
        Cover Art* {coverArtFile?.name && '(Selected)'}
      </label>
      <input
        type="file"
        id="coverArtFile"
        name="coverArtFile"
        onChange={onFileChange}
        accept="image/*"
        required
        className="block w-full text-white"
      />
    </div>
  </div>
);

interface GenreSectionProps {
  genre: string;
  subGenre1: string;
  subGenre2: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const GenreSection = ({ genre, subGenre1, subGenre2, onChange }: GenreSectionProps) => (
  <div className="space-y-4">
    <div>
      <label htmlFor="genre" className="block text-sm font-medium text-white">
        Genre*
      </label>
      <select
        id="genre"
        name="genre"
        value={genre}
        onChange={onChange}
        required
        className="mt-1 block w-24 rounded-md border-gray-600 bg-gray-700 text-white text-center mx-auto shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Select a genre</option>
        <option value="Alternative">Alternative</option>
        <option value="Avant-Garde/Experimental">Avant-Garde/Experimental</option>
        <option value="Blues">Blues</option>
        <option value="Classical">Classical</option>
        <option value="Country">Country</option>
        <option value="Easy Listening">Easy Listening</option>
        <option value="Electronic">Electronic</option>
        <option value="Folk">Folk</option>
        <option value="Hip-Hop/Rap">Hip-Hop/Rap</option>
        <option value="Jazz">Jazz</option>
        <option value="Latin">Latin</option>
        <option value="Metal">Metal</option>
        <option value="Punk">Punk</option>
        <option value="RnB">RnB</option>
        <option value="Rock">Rock</option>
        <option value="World">World</option>
      </select>
    </div>
    <div className="flex justify-evenly">
      <div>
        <label htmlFor="subGenre1" className="block text-sm font-medium text-white">
          Sub Genre
        </label>
        <input 
          type="text" 
          id="subGenre1" 
          name="subGenre1" 
          className="text-black rounded-md text-sm" 
          value={subGenre1} 
          onChange={onChange}
        />
      </div>
      <div>
        <label htmlFor="subGenre2" className="block text-sm font-medium text-white">
          Sub Genre
        </label>
        <input 
          type="text" 
          id="subGenre2" 
          name="subGenre2" 
          className="text-black rounded-md text-sm" 
          value={subGenre2} 
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

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

interface ReleaseDetailsSectionProps {
  releaseTitle: string;
  songTitle: string;
  isAIGenerated: boolean;
  isExplicit: boolean;
  quantity: number;
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