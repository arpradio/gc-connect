'use client';

import { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { CIP60FormData, Artist, ContributingArtist, Author } from '@/types';
import ArtistForm from "./artistForm"

export interface CIP60FormProps {
  formState: CIP60FormData;
  onFormChange: Dispatch<SetStateAction<CIP60FormData>>;
  onFileSelect?: (fileType: 'song' | 'cover', file: File) => void;
}

export default function CIP60Form({ formState, onFormChange, onFileSelect }: CIP60FormProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFormChange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onFormChange(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;

    if (files && files[0]) {
      if (onFileSelect) {
        onFileSelect(name === 'songFile' ? 'song' : 'cover', files[0]);
      }

      onFormChange(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const handleAddArtist = () => {
    onFormChange(prev => ({
      ...prev,
      artists: [
        ...prev.artists,
        { id: `artist-${prev.artists.length}`, name: '', isni: '', links: {} }
      ]
    }));
  };

  const handleUpdateArtist = (index: number, updatedArtist: Artist) => {
    onFormChange(prev => {
      const newArtists = [...prev.artists];
      newArtists[index] = updatedArtist;
      return {
        ...prev,
        artists: newArtists
      };
    });
  };

  const handleRemoveArtist = (index: number) => {
    onFormChange(prev => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index)
    }));
  };

  const handleAddFeaturedArtist = () => {
    onFormChange(prev => ({
      ...prev,
      featuredArtists: [
        ...prev.featuredArtists,
        { id: `featured-${prev.featuredArtists.length}`, name: '', isni: '', links: {} }
      ]
    }));
  };

  const handleUpdateFeaturedArtist = (index: number, updatedArtist: Artist) => {
    onFormChange(prev => {
      const newArtists = [...prev.featuredArtists];
      newArtists[index] = updatedArtist;
      return {
        ...prev,
        featuredArtists: newArtists
      };
    });
  };

  const handleRemoveFeaturedArtist = (index: number) => {
    onFormChange(prev => ({
      ...prev,
      featuredArtists: prev.featuredArtists.filter((_, i) => i !== index)
    }));
  };
  const handleAddContributingArtist = () => {
    onFormChange(prev => ({
      ...prev,
      contributingArtists: [
        ...prev.contributingArtists,
        {
          id: `contributing-${prev.contributingArtists.length}`,
          name: '',
          ipn: '',
          ipi: '',
          roles: [],
          links: {}
        }
      ]
    }));
  };
  const handleUpdateContributingArtist = (index: number, updates: Partial<ContributingArtist>) => {
    onFormChange(prev => {
      const newArtists = [...prev.contributingArtists];
      newArtists[index] = {
        ...newArtists[index],
        ...updates
      };

      console.log('Updating artist:', index, 'with:', updates);
      console.log('Updated artist:', newArtists[index]);

      return {
        ...prev,
        contributingArtists: newArtists
      };
    });
  };
  const handleRemoveContributingArtist = (index: number) => {
    onFormChange(prev => ({
      ...prev,
      contributingArtists: prev.contributingArtists.filter((_, i) => i !== index)
    }));
  };

  const handleAddAuthor = () => {
    onFormChange(prev => ({
      ...prev,
      authors: [
        ...prev.authors,
        { id: `author-${prev.authors.length}`, name: '', ipi: '', share: '', role: '' }
      ]
    }));
  };

  const calculateTotalShare = (authors: Author[]): number => {
    return authors.reduce((total, author) => total + (Number(author.share) || 0), 0);
  };

  const handleUpdateAuthor = (index: number, updates: Partial<Author>) => {
    onFormChange(prev => {
      const newAuthors = [...prev.authors];
      newAuthors[index] = { ...newAuthors[index], ...updates };

      if ('share' in updates) {
        const totalShare = calculateTotalShare(newAuthors);
        if (totalShare > 100) {
          const excess = totalShare - 100;
          const newShare = Number(updates.share) - excess;
          newAuthors[index] = { ...newAuthors[index], share: String(Math.max(0, newShare)) };
        }
      }

      return {
        ...prev,
        authors: newAuthors
      };
    });
  };

  const handleRemoveAuthor = (index: number) => {
    onFormChange(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  return (
    <form className="space-y-8 text-center m-0" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-4">
        <div className="space-y-4">


          <div className='mb-4'>
            <label htmlFor="songTitle" className="block text-lg font-bold text-white ">
              Song Title*
            </label>
            <input
              type="text"
              id="songTitle"
              name="songTitle"
              value={formState.songTitle}
              onChange={handleInputChange}
              required
              className="mt-1 block md:w-full lg:w-[20rem] rounded-md border-gray-600  mx-auto bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <h3 className="text-lg font-bold font-mono  text-white">Artists*</h3>

        {formState.artists.map((artist, index) => (
          <ArtistForm
            key={artist.id}
            artist={artist}
            onUpdate={(updated) => handleUpdateArtist(index, updated)}
            onRemove={index > 0 ? () => handleRemoveArtist(index) : undefined}
            showRemove={index > 0}
          />
        ))}

        <button
          type="button"
          onClick={handleAddArtist}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          <PlusCircle size={20} />
          Add Artist
        </button>
      </div>

      <div className="m-0 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showFeatured"
            checked={formState.featuredArtists.length > 0}
            onChange={(e) => {
              if (!e.target.checked) {
                onFormChange(prev => ({ ...prev, featuredArtists: [] }));
              } else {
                handleAddFeaturedArtist();
              }
            }}
            className="w-4 h-4"
          />
          <label htmlFor="showFeatured" className="text-white">
            Include Featured Artists
          </label>
        </div>

        {formState.featuredArtists.length > 0 && (
          <div className="pl-6 space-y-4">
            {formState.featuredArtists.map((artist, index) => (
              <ArtistForm
                key={artist.id}
                artist={artist}
                onUpdate={(updated) => handleUpdateFeaturedArtist(index, updated)}
                onRemove={() => handleRemoveFeaturedArtist(index)}
              />
            ))}
            <button
              type="button"
              onClick={handleAddFeaturedArtist}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              <PlusCircle size={20} />
              Add Featured Artist
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showContributing"
            checked={formState.contributingArtists.length > 0}
            onChange={(e) => {
              if (!e.target.checked) {
                onFormChange(prev => ({ ...prev, contributingArtists: [] }));
              } else {
                handleAddContributingArtist();
              }
            }}
            className="w-4 h-4"
          />
          <label htmlFor="showContributing" className="text-white">
            Include Contributing Artists
          </label>
        </div>

        {formState.contributingArtists.length > 0 && (
          <div className="pl-6 space-y-4">
            {formState.contributingArtists.map((artist, index) => (
              <div key={artist.id} className="p-4 bg-gray-800 rounded-lg space-y-3">
                <ArtistForm
                  artist={artist}
                  onUpdate={(updated) => handleUpdateContributingArtist(index, updated)}
                  onRemove={() => handleRemoveContributingArtist(index)}
                />
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex justify-evenly gap-2">
                    <input
                      type="text"
                      placeholder="IPN"
                      value={artist.ipn || ''}
                      onChange={(e) => handleUpdateContributingArtist(index, { ipn: e.target.value })}
                      className="px-3 py-1 bg-gray-700 rounded text-white w-1/3"
                    />
                    <input
                      type="text"
                      placeholder="IPI"
                      value={artist.ipi || ''}
                      onChange={(e) => handleUpdateContributingArtist(index, { ipi: e.target.value })}
                      className="px-3 py-1 bg-gray-700 rounded text-white w-1/3"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className=" items-center mx-auto ">Role:
                      <input
                        type="text"
                        placeholder=" eg. Vocals/MC"
                        className=" py-1 w-[10rem] mx-2  bg-gray-700 rounded text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const newRole = input.value.trim();
                            if (newRole) {
                              const updatedRoles = [...(artist.roles || []), newRole];
                              handleUpdateContributingArtist(index, { roles: updatedRoles });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const newRole = input.value.trim();
                          if (newRole) {
                            const updatedRoles = [...(artist.roles || []), newRole];
                            handleUpdateContributingArtist(index, { roles: updatedRoles });
                            input.value = '';
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                      >
                        Add
                      </button>
                    </div>
                    <p className="italic text-xs text-amber-200">Click Add button for each role you wish to include!</p>
                    <div className="flex flex-wrap gap-2">
                      {artist.roles && artist.roles.map((role, roleIndex) => (
                        <span
                          key={roleIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-blue-500/20 text-blue-300"
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedRoles = artist.roles.filter((_, i) => i !== roleIndex);
                              handleUpdateContributingArtist(index, { roles: updatedRoles });
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            ×
                          </button>

                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddContributingArtist}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              <PlusCircle size={20} />
              Add Contributing Artist
            </button>
          </div>
        )}
      </div>

      <div className="">
        <div className="flex items-center mb-2 gap-3">
          <input
            type="checkbox"
            id="showAuthors"
            checked={formState.authors.length > 0}
            onChange={(e) => {
              if (!e.target.checked) {
                onFormChange(prev => ({ ...prev, authors: [] }));
              } else {
                handleAddAuthor();
              }
            }}
            className="w-4 h-4"
          />
          <label htmlFor="showAuthors" className="text-white">
            Include Authors/Owners
          </label>
        </div>

        {formState.authors.length > 0 && (
          <div className="pl-2 ">
            {formState.authors.map((author, index) => (
              <div key={author.id} className="p-4 bg-gray-800 border-gray-400 border-[1px] rounded  space-y-3">
                <div className=" justify evenly flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Author Name"
                    value={author.name}
                    onChange={(e) => handleUpdateAuthor(index, { name: e.target.value })}
                    className="flex-1 px-3 bg-gray-700 rounded text-white"
                  />
                  <input
                    type="text"
                    placeholder="IPI"
                    value={author.ipi || ''}
                    onChange={(e) => handleUpdateAuthor(index, { ipi: e.target.value })}
                    className="flex-1 w-36  bg-gray-700 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Share"
                    value={author.share || ''}
                    min="1"
                    max="100"
                    onChange={(e) => handleUpdateAuthor(index, { share: e.target.value })}
                    className=" w-16  bg-gray-700 rounded text-white"
                  />
                  <select

                    value={author.role || ''}
                    onChange={(e) => handleUpdateAuthor(index, { role: e.target.value })}
                    className="flex-1 px-3 w-[70px]  bg-gray-700 rounded text-white"
                  >
                    <option>Select Role</option>
                    <option value="Author/Composer">Author/Composer</option>
                    <option value="Author">Author</option>
                    <option value="Composer">Composer</option>
                    <option value="Arranger">Arranger</option>
                    <option value="Adaptor">Adaptor</option>
                    <option value="Translator">Translator</option>
                    <option value="Publisher">Publisher</option>
                    <option value="Sub-Publisher">Sub-Publisher</option>
                    <option value="Administrator">Administrator</option>
                  </select>



                  <button
                    type="button"
                    onClick={() => handleRemoveAuthor(index)}
                    className="p-2 text-red-500 hover:text-red-400"
                  >
                    <X size={20} />
                  </button>
                </div>


              </div>


            ))}

            <div className=" w-full ">
              <div className={`text-sm mx-4 text-end ${calculateTotalShare(formState.authors) === 100
                  ? 'text-green-500'
                  : 'text-yellow-500'
                }`}>
                Total Share: {calculateTotalShare(formState.authors)}%
                {calculateTotalShare(formState.authors) !== 100 && (
                  <p className="text-yellow-500 ">
                    Total share must equal 100%
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddAuthor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              <PlusCircle size={20} />
              Add Author
            </button>
          </div>
        )}
      </div>


      <label htmlFor="songFile" className="block text-lg h-2 font-medium text-white">
        Song File* {formState.songFile?.name && '(Selected)'}
      </label>
      <div className="bg-black p-4 w-fit mx-auto  rounded-xl border-[1px] items-center border-color-silver">


        <input
          type="file"
          id="songFile"
          name="songFile"
          onChange={handleFileChange}
          accept="audio/*"
          required
          className="w-full text-white file:mr-4 file:py-2 file:px-4 
                      file:rounded-full file:border-0 file:text-sm file:font-semibold 
                      file:bg-blue-600 file:text-white hover:file:bg-blue-500"
        />



      </div>


      <div>
        <label htmlFor="genre" className="block text-sm font-medium text-white">
          Genre*
        </label>
        <select
          id="genre"
          name="genre"
          value={formState.genre}
          onChange={handleInputChange}
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
          <input type='text' id='subGenre1' name='subGenre1' className='text-black rounded-md text-sm' value={formState.subGenre1} onChange={handleInputChange}></input>
        </div>

        <div>
          <label htmlFor="subGenre2" id='subGenre1' className="block font-medium text-white text-sm">
            Sub Genre
          </label>
          <input type='text' name='subGenre2' className='text-black rounded-md text-sm' value={formState.subGenre2}
            onChange={handleInputChange}></input>
        </div> </div>

      <div>
        <label htmlFor="producer" id='producer' className="block font-medium text-white text-sm ">
          Producer
        </label>
        <input type='text' name='producer' className='text-black text-sm rounded-md' value={formState.producer}
          onChange={handleInputChange}></input>
      </div>

      <div>
        <label htmlFor="mastering_engineer" id='mastering_engineer' className="block font-medium text-white text-sm">
          Mastering Engineer
        </label>
        <input type='text' name='mastering_engineer' className='text-black rounded-md text-sm' value={formState.mastering_engineer}
          onChange={handleInputChange}></input>
      </div>

      <div>
        <label htmlFor="mix_engineer" id='mix_engineer' className="block text-sm font-medium text-white">
          Mix Engineer
        </label>
        <input type='text' name='mix_engineer' className='text-black text-sm rounded-md' value={formState.mix_engineer}
          onChange={handleInputChange}></input>
      </div>

      <div className="flex justify-evenly mx-auto">
        <div>
          <label htmlFor="isrc" className="block text-sm font-medium text-white">
            ISRC
          </label>
          <input
            type="text"
            id="isrc"
            name="isrc"
            value={formState.isrc}
            onChange={handleInputChange}
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
            value={formState.iswc}
            onChange={handleInputChange}
            disabled={formState.isAIGenerated}
            className="mt-1 block w-full rounded-md text-sm border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>
      <div className=" flex justify-evenly mx-auto ">
        <div>
          <label htmlFor="recordingOwner" className="block text-sm font-medium text-white">
            Recording Owner*
          </label>
          <input
            type="text"
            id="recordingOwner"
            name="recordingOwner"
            value={formState.recordingOwner}
            title="℗ Prepended to input automatically."
            placeholder="Enter Year and Owner Name."
            onChange={handleInputChange}
            required
            className="mt-1 block px-4 rounded-md border-gray-600 bg-gray-700 text-white  text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            value={formState.compositionOwner}
            title="© Prepended to input automatically."
            placeholder="Enter Year and Owner Name."
            onChange={handleInputChange}
            required
            disabled={formState.isAIGenerated}
            className="mt-1 block rounded-md text-sm border-gray-600 bg-gray-700 px-4 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex justify-evenly">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isAIGenerated"
              checked={formState.isAIGenerated}
              onChange={handleCheckboxChange}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">AI Generated</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isExplicit"
              checked={formState.isExplicit}
              onChange={handleCheckboxChange}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">Explicit Content</span>
          </label>
        </div> </div>


    </form>
  );
}