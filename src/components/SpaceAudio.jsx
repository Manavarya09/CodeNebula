import { useEffect, useRef, useState } from 'react'

export function SpaceAudio({ active = false }) {
  const audioContextRef = useRef(null)
  const gainNodeRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)
  
  useEffect(() => {
    if (!active) {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
        setIsPlaying(false)
      }
      return
    }
    
    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        audioContextRef.current = new AudioContext()
        
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.gain.value = volume
        gainNodeRef.current.connect(audioContextRef.current.destination)
        
        const drone1 = createDrone(audioContextRef.current, 60, 0.15)
        const drone2 = createDrone(audioContextRef.current, 80, 0.1)
        const drone3 = createDrone(audioContextRef.current, 120, 0.08)
        
        const lfo = audioContextRef.current.createOscillator()
        lfo.frequency.value = 0.1
        const lfoGain = audioContextRef.current.createGain()
        lfoGain.gain.value = 10
        lfo.connect(lfoGain)
        
        setIsPlaying(true)
      } catch (error) {
        console.warn('Audio initialization failed:', error)
      }
    }
    
    initAudio()
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [active])
  
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }, [volume])
  
  const createDrone = (context, frequency, amplitude) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const filter = context.createBiquadFilter()
    
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    
    filter.type = 'lowpass'
    filter.frequency.value = 200
    filter.Q.value = 1
    
    gain.gain.value = amplitude
    
    oscillator.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    
    oscillator.start()
    
    return { oscillator, gain, filter }
  }
  
  const toggleAudio = () => {
    if (!audioContextRef.current) {
      return
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
      setIsPlaying(true)
    } else {
      audioContextRef.current.suspend()
      setIsPlaying(false)
    }
  }
  
  return null
}

export function AmbientSpaceSounds({ 
  enableDrone = true,
  enableWind = false,
  enableHums = false,
  volume = 0.3
}) {
  const [isEnabled, setIsEnabled] = useState(false)
  
  useEffect(() => {
    window.toggleSpaceAudio = () => {
      setIsEnabled(prev => !prev)
    }
    
    window.setSpaceVolume = (v) => {
      setIsEnabled(v)
    }
    
    return () => {
      delete window.toggleSpaceAudio
      delete window.setSpaceVolume
    }
  }, [])
  
  return <SpaceAudio active={isEnabled && enableDrone} />
}

export function AudioVisualizer({ active = false }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  
  useEffect(() => {
    if (!active || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 10, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const time = Date.now() * 0.001
      
      for (let i = 0; i < 5; i++) {
        const x = Math.sin(time + i * 0.5) * 100 + canvas.width / 2
        const y = Math.cos(time * 1.5 + i) * 50 + canvas.height / 2
        const radius = 20 + Math.sin(time * 2 + i) * 10
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)')
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
      
      animationRef.current = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active])
  
  if (!active) return null
  
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.5,
        pointerEvents: 'none'
      }}
    />
  )
}

export function SoundEffects() {
  const playSound = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    switch (type) {
      case 'click':
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.1)
        break
        
      case 'hover':
        oscillator.frequency.value = 400
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.05)
        break
        
      case 'whoosh':
        oscillator.frequency.setValueAtTime(200, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.5)
        break
        
      case 'powerUp':
        oscillator.frequency.setValueAtTime(200, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.3)
        break
    }
  }
  
  useEffect(() => {
    window.playSoundEffect = playSound
    return () => delete window.playSoundEffect
  }, [])
  
  return null
}