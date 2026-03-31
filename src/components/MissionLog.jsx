import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'

const missionLog = [
  { time: '00:00', message: 'System initialization complete', type: 'system' },
  { time: '00:01', message: 'Galaxy mapping started', type: 'info' },
  { time: '00:02', message: 'Starfield analysis complete', type: 'success' },
  { time: '00:03', message: 'Nebula sector scanned', type: 'info' },
]

export function MissionLog() {
  const { selectedRepo, repositories, userData } = useStore()
  const [logs, setLogs] = useState(missionLog)
  const [isExpanded, setIsExpanded] = useState(false)
  const logEndRef = useRef(null)
  
  useEffect(() => {
    if (selectedRepo) {
      const newLog = {
        time: new Date().toISOString().substr(14, 5),
        message: `Target acquired: ${selectedRepo.name}`,
        type: 'success'
      }
      setLogs(prev => [...prev.slice(-19), newLog])
    }
  }, [selectedRepo])
  
  useEffect(() => {
    if (userData) {
      const newLog = {
        time: new Date().toISOString().substr(14, 5),
        message: `User data loaded: ${userData.login}`,
        type: 'info'
      }
      setLogs(prev => [...prev.slice(-19), newLog])
    }
  }, [userData])
  
  useEffect(() => {
    if (repositories.length > 0) {
      const newLog = {
        time: new Date().toISOString().substr(14, 5),
        message: `${repositories.length} repositories detected`,
        type: 'success'
      }
      setLogs(prev => [...prev.slice(-19), newLog])
    }
  }, [repositories])
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  
  const typeColors = {
    system: '#4fc3f7',
    info: '#ffffff',
    success: '#06ffa5',
    warning: '#ffa500',
    error: '#ff6b6b'
  }
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      right: '24px',
      width: isExpanded ? '350px' : '250px',
      background: 'linear-gradient(135deg, rgba(0, 10, 30, 0.9), rgba(10, 20, 50, 0.8))',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#00d4ff',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          MISSION LOG
        </span>
        <span style={{
          color: '#666',
          fontSize: '10px'
        }}>
          {isExpanded ? '▼' : '▲'}
        </span>
      </div>
      
      {isExpanded && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              padding: '6px 8px',
              fontFamily: 'monospace',
              fontSize: '11px',
              borderRadius: '4px',
              background: i === logs.length - 1 ? 'rgba(0, 212, 255, 0.1)' : 'transparent'
            }}>
              <span style={{ color: '#666', flexShrink: 0 }}>[{log.time}]</span>
              <span style={{ color: typeColors[log.type] || '#fff' }}>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
      
      {!isExpanded && (
        <div style={{
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#666'
        }}>
          {logs.length} entries
        </div>
      )}
    </div>
  )
}

export function ActivityFeed() {
  const { repositories, selectedRepo } = useStore()
  const [activities, setActivities] = useState([])
  
  useEffect(() => {
    const mockActivities = repositories.slice(0, 5).map((repo, i) => ({
      id: i,
      type: ['star', 'fork', 'watch', 'clone'][Math.floor(Math.random() * 4)],
      repo: repo.name,
      time: Math.floor(Math.random() * 60),
      user: ['user1', 'dev2', 'maintainer3', 'contrib4'][Math.floor(Math.random() * 4)]
    }))
    setActivities(mockActivities)
  }, [repositories])
  
  const typeIcons = {
    star: '★',
    fork: '⑂',
    watch: '👁',
    clone: '⬇'
  }
  
  const typeColors = {
    star: '#ffa500',
    fork: '#a855f7',
    watch: '#06ffa5',
    clone: '#00d4ff'
  }
  
  return (
    <div style={{
      position: 'absolute',
      top: '140px',
      right: '24px',
      width: '280px',
      background: 'rgba(0, 10, 30, 0.8)',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a855f7',
        marginBottom: '12px',
        letterSpacing: '1px'
      }}>
        LIVE ACTIVITY
      </div>
      
      {activities.map((activity, i) => (
        <div key={activity.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <span style={{ 
            color: typeColors[activity.type],
            fontSize: '14px'
          }}>
            {typeIcons[activity.type]}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#fff'
            }}>
              {activity.user}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#666'
            }}>
              {activity.repo}
            </div>
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#666'
          }}>
            {activity.time}m ago
          </div>
        </div>
      ))}
    </div>
  )
}

export function SystemMessages() {
  const { repositories, isLoading } = useStore()
  const [messages, setMessages] = useState([])
  
  useEffect(() => {
    if (isLoading) {
      setMessages(prev => [...prev, { 
        text: 'Scanning GitHub repositories...', 
        type: 'loading' 
      }])
    } else if (repositories.length > 0) {
      setMessages(prev => [...prev, { 
        text: `Galaxy generated with ${repositories.length} planets`, 
        type: 'success' 
      }])
    }
  }, [isLoading, repositories.length])
  
  return null
}

export default MissionLog