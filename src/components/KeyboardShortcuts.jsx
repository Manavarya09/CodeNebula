import { useEffect, useState } from 'react'
import useStore from '../store/useStore'

const defaultShortcuts = {
  '1': { action: 'setCameraMode', args: ['orbit'], description: 'Orbit camera' },
  '2': { action: 'setCameraMode', args: ['fly'], description: 'Fly camera' },
  '3': { action: 'setCameraMode', args: ['chase'], description: 'Chase camera' },
  '4': { action: 'setCameraMode', args: ['cinematic'], description: 'Cinematic camera' },
  '5': { action: 'setCameraMode', args: ['pan'], description: 'Pan camera' },
  'space': { action: 'toggleTour', description: 'Toggle auto-tour' },
  'f': { action: 'toggleFullscreen', description: 'Toggle fullscreen' },
  'h': { action: 'toggleHUD', description: 'Toggle HUD' },
  'a': { action: 'toggleAudio', description: 'Toggle audio' },
  'r': { action: 'resetCamera', description: 'Reset camera' },
  'esc': { action: 'clearSelection', description: 'Clear selection' },
  '?': { action: 'showHelp', description: 'Show help' },
  '+': { action: 'zoomIn', description: 'Zoom in' },
  '-': { action: 'zoomOut', description: 'Zoom out' },
}

export function KeyboardShortcuts() {
  const { 
    setIsTourActive, 
    setCameraMode,
    selectedRepo,
    setSelectedRepo,
    cameraTarget,
    setCameraTarget
  } = useStore()
  
  const [showHelp, setShowHelp] = useState(false)
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)
  
  const executeAction = (action, args = []) => {
    switch (action) {
      case 'setCameraMode':
        window.setCameraMode?.(args[0])
        break
      case 'toggleTour':
        setIsTourActive(prev => !prev)
        break
      case 'toggleFullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
        break
      case 'toggleHUD':
        window.toggleHUD?.()
        break
      case 'toggleAudio':
        window.toggleSpaceAudio?.()
        break
      case 'resetCamera':
        window.setCameraMode?.('orbit')
        setSelectedRepo(null)
        break
      case 'clearSelection':
        setSelectedRepo(null)
        break
      case 'showHelp':
        setShowHelp(prev => !prev)
        break
      case 'zoomIn':
        const currentZoom = window.getZoom?.() || 1
        window.setZoom?.(currentZoom * 1.2)
        break
      case 'zoomOut':
        const currentZoom2 = window.getZoom?.() || 1
        window.setZoom?.(currentZoom2 / 1.2)
        break
      default:
        console.log('Unknown action:', action)
    }
  }
  
  useEffect(() => {
    window.showKeyboardHelp = () => setShowHelp(true)
    window.hideKeyboardHelp = () => setShowHelp(false)
    
    return () => {
      delete window.showKeyboardHelp
      delete window.hideKeyboardHelp
    }
  }, [])
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      
      if (showHelp && key !== '?' && key !== 'escape') {
        setShowHelp(false)
      }
      
      const shortcut = shortcuts[key]
      if (shortcut) {
        e.preventDefault()
        executeAction(shortcut.action, shortcut.args)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, showHelp])
  
  useEffect(() => {
    window.registerShortcut = (key, action, args, description) => {
      setShortcuts(prev => ({
        ...prev,
        [key]: { action, args, description }
      }))
    }
    
    window.unregisterShortcut = (key) => {
      setShortcuts(prev => {
        const newShortcuts = { ...prev }
        delete newShortcuts[key]
        return newShortcuts
      })
    }
    
    return () => {
      delete window.registerShortcut
      delete window.unregisterShortcut
    }
  }, [])
  
  return null
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { shortcuts } = useStore()
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
    }
  }, [query, isOpen])
  
  const filteredShortcuts = Object.entries(shortcuts).filter(([key, value]) => 
    value.description.toLowerCase().includes(query.toLowerCase())
  )
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 10, 30, 0.95)',
      border: '1px solid #00d4ff',
      borderRadius: '8px',
      padding: '16px',
      width: '400px',
      zIndex: 1000,
      boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)'
    }}>
      <div style={{
        color: '#00d4ff',
        fontFamily: 'monospace',
        fontSize: '12px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>&gt;</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands..."
          autoFocus
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '14px',
            outline: 'none',
            flex: 1
          }}
        />
      </div>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {filteredShortcuts.map(([key, value], index) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: index === selectedIndex ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}>
              {value.description}
            </span>
            <span style={{ 
              color: '#00d4ff', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              background: 'rgba(0, 212, 255, 0.2)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {key.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <div style={{
        color: '#666',
        fontFamily: 'monospace',
        fontSize: '10px',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        Press ESC to close
      </div>
    </div>
  )
}

export default KeyboardShortcuts