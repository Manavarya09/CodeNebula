const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  R: '#198CE7',
  MATLAB: '#e16737',
  Jupyter: '#DA5B0B',
  Rust: '#dea584',
  Swift: '#F05138',
  Shell: '#89e051',
  PowerShell: '#012456',
  Dockerfile: '#384d54'
}

export function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#8b8b8b'
}

export function mapRepositoriesToPlanets(repositories) {
  const maxStars = Math.max(...repositories.map(r => r.stargazers_count), 1)
  const minStars = Math.min(...repositories.map(r => r.stargazers_count), 0)
  const starsRange = maxStars - minStars || 1
  
  return repositories.map((repo, index) => {
    const normalizedStars = (repo.stargazers_count - minStars) / starsRange
    
    const theta = (index / repositories.length) * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 15 + Math.random() * 25
    
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.4
    const z = radius * Math.cos(phi)
    
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      languageColor: getLanguageColor(repo.language),
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: repo.size,
      commits: repo.default_branch === 'main' ? Math.floor(Math.random() * 500) + 10 : Math.floor(Math.random() * 200) + 10,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      isFork: repo.fork,
      isPrivate: repo.private,
      
      position: [x, y, z],
      scale: 0.3 + normalizedStars * 1.2,
      orbitRadius: Math.sqrt(x * x + z * z),
      orbitSpeed: 0.1 + (1 - normalizedStars) * 0.3,
      orbitPhase: Math.random() * Math.PI * 2,
      
      hasRing: repo.stargazers_count > 100,
      ringColor: getLanguageColor(repo.language),
      moonCount: Math.floor(repo.forks_count / 10),
      
      contributionScore: calculateContributionScore(repo)
    }
  })
}

function calculateContributionScore(repo) {
  const starsWeight = Math.log10(repo.stargazers_count + 1) * 2
  const forksWeight = Math.log10(repo.forks_count + 1) * 1.5
  const sizeWeight = Math.log10(repo.size + 1) * 0.5
  
  return starsWeight + forksWeight + sizeWeight
}

export function generateCommitParticles(planet, commitCount) {
  const particles = []
  const count = Math.min(commitCount, 200)
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const radius = planet.scale * 2 + Math.random() * planet.scale * 3
    const height = (Math.random() - 0.5) * planet.scale * 2
    
    particles.push({
      offset: [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ],
      speed: planet.orbitSpeed * (0.5 + Math.random() * 0.5),
      phase: Math.random() * Math.PI * 2,
      size: 0.02 + Math.random() * 0.03,
      opacity: 0.3 + Math.random() * 0.7
    })
  }
  
  return particles
}

export function mapEventsToContributions(events) {
  const contributionsByDate = {}
  
  events.forEach(event => {
    if (event.type === 'PushEvent') {
      const date = event.created_at.split('T')[0]
      contributionsByDate[date] = (contributionsByDate[date] || 0) + event.payload.commits?.length || 1
    }
  })
  
  return contributionsByDate
}
