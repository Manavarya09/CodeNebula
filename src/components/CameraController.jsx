import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/useStore'

export default function CameraController() {
  const controlsRef = useRef()
  const { camera } = useThree()
  const { selectedRepo, cameraTarget, isTourActive, setIsTourActive, repositories, getFilteredRepositories } = useStore()
  
  const targetPosition = useRef(new THREE.Vector3(0, 30, 50))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const tourIndex = useRef(0)
  const tourTimer = useRef(0)
  
  useEffect(() => {
    if (selectedRepo && cameraTarget) {
      const [x, y, z] = selectedRepo.position
      const planetPos = new THREE.Vector3(x, y, z)
      
      const direction = planetPos.clone().normalize()
      const cameraOffset = direction.multiplyScalar(selectedRepo.scale * 8)
      cameraOffset.y += selectedRepo.scale * 3
      
      targetPosition.current.copy(planetPos).add(cameraOffset)
      targetLookAt.current.copy(planetPos)
      
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
    } else if (!isTourActive) {
      targetPosition.current.set(0, 30, 50)
      targetLookAt.current.set(0, 0, 0)
      
      if (controlsRef.current) {
        controlsRef.current.enabled = true
      }
    }
  }, [selectedRepo, cameraTarget, isTourActive])
  
  useFrame((state, delta) => {
    if (isTourActive && repositories.length > 0) {
      tourTimer.current += delta
      
      if (tourTimer.current > 3) {
        tourTimer.current = 0
        tourIndex.current = (tourIndex.current + 1) % repositories.length
        
        const repo = repositories[tourIndex.current]
        if (repo) {
          const [x, y, z] = repo.position
          const planetPos = new THREE.Vector3(x, y, z)
          
          const direction = planetPos.clone().normalize()
          const cameraOffset = direction.multiplyScalar(repo.scale * 6)
          cameraOffset.y += repo.scale * 2
          
          targetPosition.current.copy(planetPos).add(cameraOffset)
          targetLookAt.current.copy(planetPos)
        }
      }
    }
    
    camera.position.lerp(targetPosition.current, 0.02)
    
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.02)
      controlsRef.current.update()
    }
  })
  
  const handleStartTour = () => {
    setIsTourActive(true)
    if (repositories.length > 0) {
      const firstRepo = repositories[0]
      const [x, y, z] = firstRepo.position
      const planetPos = new THREE.Vector3(x, y, z)
      
      const direction = planetPos.clone().normalize()
      const cameraOffset = direction.multiplyScalar(firstRepo.scale * 6)
      cameraOffset.y += firstRepo.scale * 2
      
      targetPosition.current.copy(planetPos).add(cameraOffset)
      targetLookAt.current.copy(planetPos)
    }
  }
  
  useEffect(() => {
    window.startTour = handleStartTour
    window.stopTour = () => setIsTourActive(false)
    
    return () => {
      delete window.startTour
      delete window.stopTour
    }
  }, [repositories, setIsTourActive])
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={150}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2}
      dampingFactor={0.05}
      enableDamping={true}
    />
  )
}
