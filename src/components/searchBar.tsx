'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchFilters } from '@/types';

interface SearchBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

const genres = [
  'Hip Hop',
  'Electronic',
  'Rock',
  'Pop',
  'Jazz',
  'R&B',
  'Classical',
  'Metal',
  'Folk',
  'Alternative',
  'Latin',
  'Afro Beat',
  'World',
  'Other',
] as const;

const releaseTypes = ['Single', 'Album/EP', 'Multiple'] as const;

type PolicyLimit = 'true' | '';

function SearchBar({ filters, onFilterChange }: SearchBarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchValue, setSearchValue] = useState<string>(filters.searchTerm || '');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [debouncedSearchTimer, setDebouncedSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const safeFilters = {
    searchTerm: filters.searchTerm || '',
    searchFields: {
      name: filters.searchFields?.name ?? false,
      title: filters.searchFields?.title ?? false,
      artist: filters.searchFields?.artist ?? false,
      genre: filters.searchFields?.genre ?? false,
      producer: filters.searchFields?.producer ?? false,
      engineer: filters.searchFields?.engineer ?? false,
    },
    genre: filters.genre || '',
    releaseType: filters.releaseType || '',
    policy_limit: filters.policy_limit === 'true' ? 'true' : '' as PolicyLimit
  };

  const updateUrl = useCallback((newFilters: SearchFilters): void => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.searchTerm) {
      params.set('search', newFilters.searchTerm);
    } else {
      params.delete('search');
    }
    
    if (newFilters.genre) {
      params.set('genre', newFilters.genre);
    } else {
      params.delete('genre');
    }
    
    if (newFilters.releaseType) {
      params.set('releaseType', newFilters.releaseType);
    } else {
      params.delete('releaseType');
    }
    
    if (newFilters.policy_limit === 'true') {
      params.set('policy_limit', 'true');
    } else {
      params.delete('policy_limit');
    }
    
    params.set('page', '1');
    
    const currentLimit = searchParams.get('limit');
    if (currentLimit) {
      params.set('limit', currentLimit);
    }
    
    // Check if all search fields are false, in which case don't add the parameter
    const allFieldsFalse = Object.values(newFilters.searchFields).every(v => v === false);
    if (!allFieldsFalse) {
      params.set('searchFields', JSON.stringify(newFilters.searchFields));
    } else {
      params.delete('searchFields');
    }
    
    const updatedFilters = {
      ...newFilters,
      limit: currentLimit || undefined
    };

    onFilterChange(updatedFilters);
    
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, onFilterChange]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (debouncedSearchTimer) {
      clearTimeout(debouncedSearchTimer);
    }
    
    const timer = setTimeout(() => {
      updateUrl({
        ...safeFilters,
        searchTerm: value
      });
    }, 500);
    
    setDebouncedSearchTimer(timer);
  };

  useEffect(() => {
    setSearchValue(filters.searchTerm || '');
  }, [filters.searchTerm]);

  const resetFilters = (): void => {
    const defaultFilters: SearchFilters = {
      searchTerm: '',
      searchFields: {
        name: false,
        title: false,
        artist: false,
        genre: false,
        producer: false,
        engineer: false,
      },
      genre: '',
      releaseType: '',
      policy_limit: ''
    };
    
    setSearchValue('');
    updateUrl(defaultFilters);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debouncedSearchTimer) {
        clearTimeout(debouncedSearchTimer);
      }
    };
  }, [debouncedSearchTimer]);

  const togglePolicyLimit = (): void => {
    const newPolicyLimit: PolicyLimit = safeFilters.policy_limit === 'true' ? '' : 'true';
    updateUrl({
      ...safeFilters,
      policy_limit: newPolicyLimit
    });
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search music..."
            value={searchValue}
            onChange={handleSearchInputChange}
            className="w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            size="sm"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1"
          >
            <X size={16} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <div
          ref={filterRef}
          className="relative mt-1 mr-24 sm:right-auto bg-black/90 z-10 rounded-lg p-4 shadow-lg w-full sm:w-[400px] md:w-[500px] lg:w-[600px] border border-neutral-700"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-medium text-white">Search in:</label>
              <div className="space-y-2">
                {Object.entries(safeFilters.searchFields).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-gray-200">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => {
                        const updatedSearchFields = {
                          ...safeFilters.searchFields,
                          [key]: !value,
                        };
                        
                        updateUrl({
                          ...safeFilters,
                          searchFields: updatedSearchFields,
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-white">Genre:</label>
              <select
                className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
                value={safeFilters.genre}
                onChange={(e) => updateUrl({ ...safeFilters, genre: e.target.value })}
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-white">Type:</label>
              <select
                className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
                value={safeFilters.releaseType}
                onChange={(e) => updateUrl({ ...safeFilters, releaseType: e.target.value })}
              >
                <option value="">All Types</option>
                {releaseTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-white">Policy Limit:</label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                <input
                  type="checkbox"
                  checked={safeFilters.policy_limit === 'true'}
                  onChange={togglePolicyLimit}
                  className="rounded"
                />
                <span className="text-sm">One Per Policy</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;