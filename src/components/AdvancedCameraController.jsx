import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/useStore'

export function AdvancedCameraController() {
  const controlsRef = useRef()
  const { camera } = useThree()
  const { 
    selectedRepo, 
    cameraTarget, 
    isTourActive, 
    setIsTourActive, 
    repositories,
    getFilteredRepositories 
  } = useStore()
  
  const [cameraMode, setCameraMode] = useState('orbit')
  const [smoothTarget, setSmoothTarget] = useState(new THREE.Vector3(0, 0, 0))
  const [smoothPosition, setSmoothPosition] = useState(new THREE.Vector3(0, 40, 70))
  const [zoom, setZoom] = useState(1)
  
  const tourIndex = useRef(0)
  const tourTimer = useRef(0)
  const initialPosition = useRef(new THREE.Vector3(0, 40, 70))
  
  const cameraModes = {
    orbit: {
      name: 'Orbit',
      description: 'Free orbit around the galaxy',
      controls: true
    },
    pan: {
      name: 'Pan',
      description: 'Pan across the galaxy',
      controls: true
    },
    fly: {
      name: 'Fly',
      description: 'First-person flight mode',
      controls: false
    },
    chase: {
      name: 'Chase',
      description: 'Follow selected planet',
      controls: false
    },
    cinematic: {
      name: 'Cinematic',
      description: 'Auto cinematic camera',
      controls: false
    }
  }
  
  useEffect(() => {
    window.setCameraMode = (mode) => {
      if (cameraModes[mode]) {
        setCameraMode(mode)
      }
    }
    window.getCameraMode = () => cameraMode
    window.setZoom = (z) => setZoom(Math.max(0.1, Math.min(3, z)))
    
    return () => {
      delete window.setCameraMode
      delete window.getCameraMode
      delete window.setZoom
    }
  }, [cameraMode])
  
  useEffect(() => {
    if (selectedRepo && cameraTarget) {
      const [x, y, z] = selectedRepo.position
      const planetPos = new THREE.Vector3(x, y, z)
      
      const direction = planetPos.clone().normalize()
      const cameraOffset = direction.multiplyScalar(selectedRepo.scale * 10)
      cameraOffset.y += selectedRepo.scale * 4
      
      setSmoothTarget(planetPos)
      setSmoothPosition(planetPos.clone().add(cameraOffset))
      
      if (cameraMode === 'chase' && controlsRef.current) {
        controlsRef.current.enabled = false
      }
    } else if (!isTourActive) {
      if (cameraMode === 'chase' || cameraMode === 'fly') {
        setSmoothTarget(new THREE.Vector3(0, 0, 0))
        setSmoothPosition(new THREE.Vector3(0, 40, 70))
      }
    }
  }, [selectedRepo, cameraTarget, isTourActive, cameraMode])
  
  useFrame((state, delta) => {
    if (cameraMode === 'cinematic' && repositories.length > 0) {
      tourTimer.current += delta
      
      if (tourTimer.current > 4) {
        tourTimer.current = 0
        tourIndex.current = (tourIndex.current + 1) % repositories.length
      }
      
      const repo = repositories[tourIndex.current]
      if (repo) {
        const [x, y, z] = repo.position
        const planetPos = new THREE.Vector3(x, y, z)
        
        const t = tourTimer.current / 4
        const nextIndex = (tourIndex.current + 1) % repositories.length
        const nextRepo = repositories[nextIndex]
        
        if (nextRepo) {
          const nextPos = new THREE.Vector3(...nextRepo.position)
          const interpolated = planetPos.lerp(nextPos, t)
          
          const direction = interpolated.clone().normalize()
          const cameraOffset = direction.multiplyScalar(30)
          cameraOffset.y += 15
          
          setSmoothTarget(interpolated)
          setSmoothPosition(state.camera.position.clone().lerp(
            interpolated.clone().add(cameraOffset), 0.02
          ))
        }
      }
    }
    
    if (cameraMode === 'fly') {
      const moveSpeed = 30 * delta
      const lookSpeed = 0.002
      
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      
      if (keys.current['w'] || keys.current['arrowup']) {
        camera.position.add(forward.multiplyScalar(moveSpeed))
      }
      if (keys.current['s'] || keys.current['arrowdown']) {
        camera.position.add(forward.multiplyScalar(-moveSpeed))
      }
      if (keys.current['a'] || keys.current['arrowleft']) {
        camera.position.add(right.multiplyScalar(-moveSpeed))
      }
      if (keys.current['d'] || keys.current['arrowright']) {
        camera.position.add(right.multiplyScalar(moveSpeed))
      }
      if (keys.current['q']) {
        camera.position.y -= moveSpeed
      }
      if (keys.current['e']) {
        camera.position.y += moveSpeed
      }
      
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
    }
    
    if (cameraMode !== 'fly') {
      camera.position.lerp(smoothPosition, 0.02)
    }
    
    if (controlsRef.current && cameraMode !== 'fly') {
      controlsRef.current.target.lerp(smoothTarget, 0.02)
      controlsRef.current.update()
    }
    
    if (controlsRef.current) {
      const targetZoom = zoom
      if (controlsRef.current.minDistance !== 5 * targetZoom) {
        controlsRef.current.minDistance = 5 * targetZoom
        controlsRef.current.maxDistance = 150 * targetZoom
      }
    }
  })
  
  const keys = useRef({})
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.key.toLowerCase()] = true
      
      if (e.key === '1') setCameraMode('orbit')
      if (e.key === '2') setCameraMode('pan')
      if (e.key === '3') setCameraMode('fly')
      if (e.key === '4') setCameraMode('chase')
      if (e.key === '5') setCameraMode('cinematic')
      if (e.key === ' ') setIsTourActive(!isTourActive)
    }
    
    const handleKeyUp = (e) => {
      keys.current[e.key.toLowerCase()] = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isTourActive, setIsTourActive])
  
  const enableControls = cameraMode === 'orbit' || cameraMode === 'pan'
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={enableControls}
      enableZoom={true}
      enableRotate={enableControls}
      minDistance={5 * zoom}
      maxDistance={150 * zoom}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 + 0.3}
      dampingFactor={0.05}
      enableDamping={true}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
    />
  )
}

export default AdvancedCameraController