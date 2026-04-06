const GITHUB_API_BASE = 'https://api.github.com'

export async function fetchGitHubUser(username) {
  const response = await fetch(`${GITHUB_API_BASE}/users/${username}`)
  if (!response.ok) {
    if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
      throw new Error('GitHub API rate limit exceeded. Please try again later.')
    }
    if (response.status === 404) {
      throw new Error(`User not found: ${username}`)
    }
    throw new Error(`Failed to fetch user (HTTP ${response.status})`)
  }
  return response.json()
}

const MAX_PAGES = 5

export async function fetchUserRepositories(username, perPage = 100) {
  const repos = []
  let page = 1
  let hasMore = true

  while (hasMore && page <= MAX_PAGES) {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`
    )

    if (!response.ok) {
      if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later.')
      }
      throw new Error(`Failed to fetch repositories (HTTP ${response.status})`)
    }

    const data = await response.json()
    repos.push(...data)

    if (data.length < perPage) {
      hasMore = false
    } else {
      page++
    }
  }

  return repos
}

export async function fetchRepositoryContributions(username) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/events?per_page=100`
    )
    
    if (!response.ok) {
      return []
    }
    
    return response.json()
  } catch (error) {
    console.warn('Could not fetch contributions:', error)
    return []
  }
}

export async function fetchGitHubData(username) {
  const [user, repositories, events] = await Promise.all([
    fetchGitHubUser(username),
    fetchUserRepositories(username),
    fetchRepositoryContributions(username)
  ])
  
  return { user, repositories, events }
}
