import { useState, useEffect } from 'react'
import Scene from './components/Scene'
import useStore from './store/useStore'
import useGithubData from './hooks/useGithubData'

function App() {
  const [username, setUsername] = useState('')
  const { 
    userData, 
    selectedRepo, 
    isLoading, 
    error, 
    activeFilter, 
    setActiveFilter, 
    searchQuery, 
    setSearchQuery,
    timelinePosition,
    setTimelinePosition,
    isTourActive,
    getLanguages 
  } = useStore()
  const { fetchData } = useGithubData()
  const languages = getLanguages()
  
  const handleSearch = (e) => {
    e.preventDefault()
    fetchData(username)
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchData(username)
    }
  }
  
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }
  
  return (
    <div className="app-container">
      <div className="canvas-container">
        <Scene />
      </div>
      
      <div className="ui-overlay">
        <form className="search-panel" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter GitHub username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Explore'}
          </button>
        </form>
        
        {userData && (
          <div className="user-badge">
            <img 
              src={userData.avatar_url} 
              alt={userData.login} 
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{userData.name || userData.login}</span>
              <span className="user-handle">@{userData.login}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {selectedRepo && (
          <div className="info-panel">
            <h2>{selectedRepo.name}</h2>
            {selectedRepo.description && (
              <p style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '14px', 
                marginBottom: '16px',
                lineHeight: 1.5
              }}>
                {selectedRepo.description}
              </p>
            )}
            
            <div className="repo-stats">
              <div className="stat">
                <span className="stat-icon">★</span>
                <span className="stat-value">{formatNumber(selectedRepo.stars)}</span>
              </div>
              <div className="stat">
                <span className="stat-icon">⑂</span>
                <span className="stat-value">{formatNumber(selectedRepo.forks)}</span>
              </div>
              <div className="stat">
                <span className="stat-icon">◉</span>
                <span className="stat-value">{selectedRepo.commits}</span>
              </div>
            </div>
            
            {selectedRepo.language && (
              <div 
                className="language-badge"
                style={{ 
                  background: `${selectedRepo.languageColor}20`,
                  border: `1px solid ${selectedRepo.languageColor}40`
                }}
              >
                <span 
                  className="language-dot" 
                  style={{ background: selectedRepo.languageColor }}
                />
                {selectedRepo.language}
              </div>
            )}
            
            <a 
              href={selectedRepo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="repo-link"
            >
              View on GitHub →
            </a>
          </div>
        )}
        
        {userData && !selectedRepo && (
          <div className="info-panel hidden">
            <h2>Select a planet</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              Click on any repository to view details
            </p>
          </div>
        )}
        
        {userData && (
          <div className="filter-panel">
            {languages.slice(0, 8).map(lang => (
              <button
                key={lang}
                className={`filter-button ${activeFilter === lang ? 'active' : ''}`}
                onClick={() => setActiveFilter(lang)}
              >
                {lang === 'all' ? 'All' : lang}
              </button>
            ))}
          </div>
        )}
        
        {userData && (
          <div className="timeline-panel">
            <span className="timeline-label">Timeline</span>
            <input
              type="range"
              className="timeline-slider"
              min="0"
              max="1"
              step="0.01"
              value={timelinePosition}
              onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
            />
          </div>
        )}
        
        {userData && (
          <button 
            className="tour-button"
            style={{ position: 'absolute', bottom: '24px', right: '24px' }}
            onClick={() => window.startTour?.()}
          >
            {isTourActive ? 'Stop Tour' : 'Auto Tour'}
          </button>
        )}
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <div className="loading-text">Exploring the universe...</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
