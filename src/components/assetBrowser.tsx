import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SearchBar from "@/components/searchBar";
import { SearchFilters, Asset } from "@/types";
import { AssetDetails } from "./asset";
import AssetCard from "./AssetCard";

type PageSize = 12 | 24 | 36 | 48;
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;

type PaginationState = {
  total: number;
  page: number;
  limit: PageSize;
  pages: number;
};

type FetchParams = {
  page: number;
  limit: PageSize;
  searchTerm: string;
  searchFields: Record<string, boolean>;
  genre?: string;
  releaseType?: string;
  policy_limit?: string;
};

export default function AssetBrowser(): React.ReactElement {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    searchFields: {
      name: true,
      title: true,
      artist: true,
      genre: true,
      producer: true,
      engineer: true,
    },
  });

  const [initialSyncDone, setInitialSyncDone] = useState<boolean>(false);
  const [initialFetchDone, setInitialFetchDone] = useState<boolean>(false);

  const isValidAsset = (asset: unknown): asset is Asset => {
    if (!asset || typeof asset !== "object") return false;

    const assetObj = asset as Record<string, unknown>;
    return (
      (typeof assetObj.id === "string" || typeof assetObj.id === "number") &&
      typeof assetObj.policy_id === "string" &&
      typeof assetObj.asset_name === "string"
    );
  };

  const currentParams = useMemo(() => {
    const rawLimit = parseInt(searchParams.get("limit") || "24", 10);

    const limit = PAGE_SIZE_OPTIONS.includes(rawLimit as PageSize)
      ? (rawLimit as PageSize)
      : 24;

    return {
      searchTerm: searchParams.get("search") || "",
      genre: searchParams.get("genre") || "",
      releaseType: searchParams.get("releaseType") || "",
      policy_limit: searchParams.get("policy_limit") || "",
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
      limit,
      searchFields: (() => {
        const searchFieldsParam = searchParams.get("searchFields");
        const defaultFields = {
          name: true,
          title: true,
          artist: true,
          genre: false,
          producer: false,
          engineer: false,
        };

        if (searchFieldsParam) {
          try {
            const parsedFields = JSON.parse(searchFieldsParam) as Record<
              string,
              boolean
            >;
            return { ...defaultFields, ...parsedFields };
          } catch (e) {
            console.error("Invalid searchFields parameter");
          }
        }
        return defaultFields;
      })(),
    };
  }, [searchParams]);

  const isInitialBrowseRequest = useMemo((): boolean => {
    return (
      currentParams.page === 1 &&
      !currentParams.searchTerm &&
      !currentParams.genre &&
      !currentParams.releaseType
    );
  }, [currentParams]);

  const createQueryString = useCallback(
    (params: Record<string, string>): string => {
      const queryParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          queryParams.set(key, value);
        } else {
          queryParams.delete(key);
        }
      });

      return queryParams.toString();
    },
    [searchParams]
  );

  const fetchAssets = useCallback(
    async (params: FetchParams): Promise<void> => {
      setLoading(true);
      try {
        const isInitialRequest =
          params.page === 1 &&
          !params.searchTerm &&
          !params.genre &&
          !params.releaseType &&
          !initialFetchDone;

        const apiParams = new URLSearchParams({
          page: params.page.toString(),
          limit: params.limit.toString(),
          search: params.searchTerm || "",
          fields: JSON.stringify(params.searchFields),
        });

        if (params.genre) apiParams.set("genre", params.genre);
        if (params.releaseType)
          apiParams.set("releaseType", params.releaseType);

        if (isInitialRequest || params.policy_limit === "true") {
          apiParams.set("policy_limit", "true");
        }

        const response = await fetch(`/api/assets?${apiParams}`);

        if (!response.ok) {
          console.log("API connection failed");
        }

        const data = await response.json();

        if (data && Array.isArray(data.data)) {
          setAssets(data.data);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total || 0,
            pages: Math.max(1, data.pagination.pages || 0),
            page: Math.min(
              params.page,
              Math.max(1, data.pagination.pages || 0)
            ),
          }));

          if (isInitialRequest) {
            setInitialFetchDone(true);
          }
        } else {
          console.log("Invalid API response format:", data);
          setAssets([]);
          setPagination((prev) => ({
            ...prev,
            total: 0,
            pages: 1,
            page: 1,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch assets:", error);
        setAssets([]);
        setPagination((prev) => ({
          ...prev,
          total: 0,
          pages: 1,
          page: 1,
        }));
      } finally {
        setLoading(false);
      }
    },
    [initialFetchDone]
  );

  useEffect(() => {
    if (!initialSyncDone) {
      setFilters({
        searchTerm: currentParams.searchTerm,
        searchFields: currentParams.searchFields,
        genre: currentParams.genre,
        releaseType: currentParams.releaseType,
        policy_limit: currentParams.policy_limit,
      } as SearchFilters);

      setPagination((prev) => ({
        ...prev,
        page: currentParams.page,
        limit: currentParams.limit,
      }));

      setInitialSyncDone(true);
    } else {
      fetchAssets({
        page: currentParams.page,
        limit: currentParams.limit,
        searchTerm: currentParams.searchTerm,
        searchFields: currentParams.searchFields,
        genre: currentParams.genre,
        releaseType: currentParams.releaseType,
        policy_limit: currentParams.policy_limit,
      });
    }
  }, [currentParams, fetchAssets, initialSyncDone]);

  const handlePageChange = (newPage: number): void => {
    if (newPage < 1 || (pagination.pages > 0 && newPage > pagination.pages)) {
      return;
    }

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', newPage.toString());

    setPagination(prev => ({
      ...prev,
      page: newPage
    }));

    router.push(`${pathname}?${newParams.toString()}`);
  };

  const handleLimitChange = (newLimit: PageSize): void => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('limit', newLimit.toString());
    newParams.set('page', '1');

    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));

    router.push(`${pathname}?${newParams.toString()}`);
  };

  const handleFilterChange = (newFilters: SearchFilters): void => {
    setFilters(newFilters);
  };

  const handlePageSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page) && page > 0 && page <= pagination.pages) {
      handlePageChange(page);
    }
  };

  const pageOptions = useMemo(() => {
    return pagination.pages > 0
      ? Array.from({ length: pagination.pages }, (_, i) => i + 1)
      : [1];
  }, [pagination.pages]);

  return (
    <div className="w-full max-w-full px-2 sm:px-4 md:px-6 lg:container lg:mx-auto overflow-hidden">
      <div className="flex flex-col space-y-4 max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Music NFTs</h1>
          <div className="w-full sm:w-auto max-w-full">
            <SearchBar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : !Array.isArray(assets) ? (
            <div className="col-span-full text-center py-8 text-white">
              Error loading assets
            </div>
          ) : assets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-white">
              No assets found
            </div>
          ) : (
            assets
              .filter(isValidAsset)
              .map((asset) => (
                <AssetCard
                  key={`asset-${asset.id}`}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                  compact={true}
                  className="w-full"
                />
              ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 w-full overflow-hidden">
          <div className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1 truncate max-w-full">
            {pagination.total > 0 && (
              <span className="truncate block">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} entries
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <select
              className="bg-neutral-800 border border-neutral-700 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm text-white overflow-hidden text-ellipsis max-w-[90px]"
              value={pagination.limit}
              onChange={(e) =>
                handleLimitChange(Number(e.target.value) as PageSize)
              }
              aria-label="Items per page"
            >
              {PAGE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value} className="text-ellipsis">
                  {value}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                className={`p-1 sm:px-2 sm:py-1 rounded border ${pagination.page <= 1
                  ? "border-neutral-700 text-neutral-500 cursor-not-allowed"
                  : "border-neutral-600 text-white hover:bg-neutral-700"
                  }`}
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                aria-label="Previous page"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <select
                className="bg-neutral-800 border border-neutral-700 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm text-white w-10 sm:w-16 text-ellipsis"
                value={pagination.page}
                onChange={handlePageSelect}
                aria-label="Go to page"
              >
                {pageOptions.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>

              <span className="text-xs sm:text-sm px-1 sm:px-2 text-gray-300 hidden sm:inline truncate">
                of {pagination.pages || 1}
              </span>

              <button
                className={`p-1 sm:px-2 sm:py-1 rounded border ${pagination.page >= pagination.pages
                  ? "border-neutral-700 text-neutral-500 cursor-not-allowed"
                  : "border-neutral-600 text-white hover:bg-neutral-700"
                  }`}
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                aria-label="Next page"
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
      >
        <DialogContent className="md:min-w-[45rem] w-fit p-0 sm:p-2 bg-black h-fit flex items-center  justify-center rounded text-white">
          <DialogTitle className="sr-only">
            Asset Details: {selectedAsset?.metadata_json?.name || "Music NFT"}
          </DialogTitle>
          {selectedAsset && (
            <AssetDetails
              asset={selectedAsset}
              onClose={() => setSelectedAsset(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}