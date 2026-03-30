import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../store/useStore'
import { generateCommitParticles } from '../utils/dataMapper'
import OrbitParticles from './OrbitParticles'

export default function Planet({ repo }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  const { selectedRepo, setSelectedRepo, setHoveredRepo, cameraTarget } = useStore()
  const isSelected = selectedRepo?.id === repo.id
  const isOtherSelected = selectedRepo && selectedRepo.id !== repo.id
  
  const particles = useMemo(() => generateCommitParticles(repo, repo.commits), [repo])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const angle = time * repo.orbitSpeed + repo.orbitPhase
    const radius = repo.orbitRadius
    
    meshRef.current.position.x = Math.cos(angle) * radius
    meshRef.current.position.z = Math.sin(angle) * radius
    meshRef.current.position.y = Math.sin(time * 0.5 + repo.orbitPhase) * 2
    
    meshRef.current.rotation.y += 0.005
    meshRef.current.rotation.x += 0.002
    
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002
    }
    
    if (glowRef.current) {
      const scale = hovered || isSelected ? 1.3 : 1.1
      glowRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
    
    const targetOpacity = hovered || isSelected ? 0.4 : 0.15
    if (glowRef.current && glowRef.current.material) {
      glowRef.current.material.opacity = THREE.MathUtils.lerp(
        glowRef.current.material.opacity,
        targetOpacity,
        0.1
      )
    }
  })
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (isSelected) {
      setSelectedRepo(null)
    } else {
      setSelectedRepo(repo)
    }
  }
  
  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    setHoveredRepo(repo)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    setHoveredRepo(null)
    document.body.style.cursor = 'auto'
  }
  
  const opacity = isOtherSelected ? 0.3 : 1
  
  return (
    <group>
      <group position={repo.position}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[repo.scale, 32, 32]} />
          <meshStandardMaterial
            color={repo.languageColor}
            emissive={repo.languageColor}
            emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
            roughness={0.7}
            metalness={0.3}
            transparent
            opacity={opacity}
          />
        </mesh>
        
        <mesh ref={glowRef} scale={1.1}>
          <sphereGeometry args={[repo.scale, 32, 32]} />
          <meshBasicMaterial
            color={repo.languageColor}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
        
        {repo.hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[repo.scale * 1.4, repo.scale * 2, 64]} />
            <meshBasicMaterial
              color={repo.ringColor}
              transparent
              opacity={0.3 * opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        <OrbitParticles
          repo={repo}
          particles={particles}
          isVisible={!isOtherSelected}
        />
        
        {repo.moonCount > 0 && (
          <group>
            {[...Array(Math.min(repo.moonCount, 3))].map((_, i) => (
              <Moon key={i} index={i} planetScale={repo.scale} orbitSpeed={0.02 + i * 0.01} />
            ))}
          </group>
        )}
        
        {(hovered || isSelected) && (
          <Html
            position={[0, repo.scale + 1, 0]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(10px)',
              transform: 'translateY(-20px)'
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                color: '#00d4ff'
              }}>
                {repo.name}
              </div>
              {repo.language && (
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: repo.languageColor
                  }} />
                  {repo.language}
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

function Moon({ index, planetScale, orbitSpeed }) {
  const moonRef = useRef()
  const orbitRadius = planetScale * (2.5 + index * 0.8)
  const orbitPhase = (index / 3) * Math.PI * 2
  
  useFrame((state) => {
    if (!moonRef.current) return
    const time = state.clock.elapsedTime
    moonRef.current.position.x = Math.cos(time * orbitSpeed * 10 + orbitPhase) * orbitRadius
    moonRef.current.position.z = Math.sin(time * orbitSpeed * 10 + orbitPhase) * orbitRadius
  })
  
  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[planetScale * 0.15, 16, 16]} />
      <meshStandardMaterial color="#888888" roughness={0.8} />
    </mesh>
  )
}
