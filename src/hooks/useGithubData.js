import { useCallback } from 'react'
import useStore from '../store/useStore'
import { fetchGitHubData } from '../utils/api'
import { mapRepositoriesToPlanets, mapEventsToContributions } from '../utils/dataMapper'

export default function useGithubData() {
  const {
    setUserData,
    setRepositories,
    setIsLoading,
    setError,
    clearSelection
  } = useStore()
  
  const fetchData = useCallback(async (username) => {
    if (!username || username.trim() === '') {
      setError('Please enter a GitHub username')
      return
    }
    
    setIsLoading(true)
    setError(null)
    clearSelection()
    
    try {
      const { user, repositories, events } = await fetchGitHubData(username.trim())
      
      const sortedRepos = repositories
        .filter(repo => !repo.fork || repo.stargazers_count > 10)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 50)
      
      const planets = mapRepositoriesToPlanets(sortedRepos)
      const contributions = mapEventsToContributions(events)
      
      setUserData({
        ...user,
        contributions
      })
      setRepositories(planets)
      setIsLoading(false)
    } catch (error) {
      setError(error.message || 'Failed to fetch GitHub data')
      setIsLoading(false)
    }
  }, [setUserData, setRepositories, setIsLoading, setError, clearSelection])
  
  return { fetchData }
}
