import { create } from 'zustand';
import type { FilterState, ResourceType, ResourceStatus } from '@/types';

interface FilterStore extends FilterState {
  setAccountIds: (ids: string[]) => void;
  setRegionIds: (ids: string[]) => void;
  setAppIds: (ids: string[]) => void;
  setResourceTypes: (types: ResourceType[]) => void;
  setSearchKeyword: (keyword: string) => void;
  setStatus: (status?: ResourceStatus) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  accountIds: [],
  regionIds: [],
  appIds: [],
  resourceTypes: [],
  searchKeyword: '',
  status: undefined,

  setAccountIds: (ids) => set({ accountIds: ids }),
  setRegionIds: (ids) => set({ regionIds: ids }),
  setAppIds: (ids) => set({ appIds: ids }),
  setResourceTypes: (types) => set({ resourceTypes: types }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setStatus: (status) => set({ status }),
  resetFilters: () => set({
    accountIds: [],
    regionIds: [],
    appIds: [],
    resourceTypes: [],
    searchKeyword: '',
    status: undefined,
  }),
}));
