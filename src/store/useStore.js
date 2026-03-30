import { create } from 'zustand'

const useStore = create((set, get) => ({
  username: '',
  userData: null,
  repositories: [],
  selectedRepo: null,
  hoveredRepo: null,
  isLoading: false,
  error: null,
  activeFilter: 'all',
  searchQuery: '',
  timelinePosition: 0,
  isTourActive: false,
  cameraTarget: null,

  setUsername: (username) => set({ username }),
  
  setUserData: (userData) => set({ userData }),
  
  setRepositories: (repositories) => set({ repositories }),
  
  setSelectedRepo: (repo) => set({ selectedRepo: repo, cameraTarget: repo?.position || null }),
  
  setHoveredRepo: (repo) => set({ hoveredRepo: repo }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setTimelinePosition: (position) => set({ timelinePosition: position }),
  
  setIsTourActive: (isActive) => set({ isTourActive: isActive }),
  
  setCameraTarget: (target) => set({ cameraTarget: target }),

  clearSelection: () => set({ selectedRepo: null, cameraTarget: null }),
  
  getFilteredRepositories: () => {
    const { repositories, activeFilter, searchQuery, timelinePosition } = get()
    let filtered = [...repositories]
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(repo => 
        repo.language?.toLowerCase() === activeFilter.toLowerCase()
      )
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query)
      )
    }
    
    if (timelinePosition > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (365 - timelinePosition * 365))
      filtered = filtered.filter(repo => new Date(repo.createdAt) >= cutoffDate)
    }
    
    return filtered
  },

  getLanguages: () => {
    const { repositories } = get()
    const languages = new Set()
    repositories.forEach(repo => {
      if (repo.language) languages.add(repo.language)
    })
    return ['all', ...Array.from(languages)]
  }
}))

export default useStore
