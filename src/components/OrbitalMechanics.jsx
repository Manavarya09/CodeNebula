import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

export function OrbitalMechanics() {
  const { repositories, selectedRepo, timelinePosition } = useStore()
  const timeScale = 1 + timelinePosition * 10
  
  const orbits = useMemo(() => {
    return repositories.map((repo, index) => {
      const semiMajorAxis = repo.orbitRadius
      const eccentricity = 0.1 + Math.random() * 0.2
      const inclination = (Math.random() - 0.5) * 0.2
      const longitudeAscending = Math.random() * Math.PI * 2
      const argumentPeriapsis = Math.random() * Math.PI * 2
      const meanAnomalyAtEpoch = Math.random() * Math.PI * 2
      const orbitalPeriod = Math.sqrt(Math.pow(semiMajorAxis, 3)) * 0.01
      
      return {
        ...repo,
        orbitalElements: {
          semiMajorAxis,
          eccentricity,
          inclination,
          longitudeAscending,
          argumentPeriapsis,
          meanAnomalyAtEpoch,
          orbitalPeriod
        }
      }
    })
  }, [repositories])
  
  useFrame((state) => {
    const time = state.clock.elapsedTime * timeScale
    
    orbits.forEach((orbit, index) => {
      const mesh = document.querySelector(`[data-orbit-index="${index}"]`)
      if (!mesh) return
      
      const { semiMajorAxis, eccentricity, inclination, longitudeAscending, argumentPeriapsis, meanAnomalyAtEpoch, orbitalPeriod } = orbit.orbitalElements
      
      const meanAnomaly = meanAnomalyAtEpoch + (2 * Math.PI * time) / orbitalPeriod
      
      const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity)
      
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
      )
      
      const r = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly))
      
      const xOrbital = r * Math.cos(trueAnomaly)
      const yOrbital = r * Math.sin(trueAnomaly)
      
      const cosO = Math.cos(longitudeAscending)
      const sinO = Math.sin(longitudeAscending)
      const cosI = Math.cos(inclination)
      const sinI = Math.sin(inclination)
      const cosW = Math.cos(argumentPeriapsis)
      const sinW = Math.sin(argumentPeriapsis)
      
      const x = (cosO * cosW - sinO * sinW * cosI) * xOrbital + (-cosO * sinW - sinO * cosW * cosI) * yOrbital
      const y = (sinO * cosW + cosO * sinW * cosI) * xOrbital + (-sinO * sinW + cosO * cosW * cosI) * yOrbital
      const z = (sinW * sinI) * xOrbital + (cosW * sinI) * yOrbital
      
      const repo = repositories[index]
      if (repo && mesh.parentElement) {
        mesh.parentElement.position.set(x, y, z)
      }
    })
  })
  
  return null
}

function solveKepler(M, e, tolerance = 1e-6) {
  let E = M
  let delta = 1
  
  while (Math.abs(delta) > tolerance) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E = E - delta
  }
  
  return E
}

export function OrbitPath({ semiMajorAxis, eccentricity, inclination = 0, color = '#00d4ff', opacity = 0.2 }) {
  const points = useMemo(() => {
    const result = []
    const segments = 128
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(theta))
      
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      
      const cosI = Math.cos(inclination)
      const y = z * Math.sin(inclination)
      
      result.push(new THREE.Vector3(x, y, z * cosI))
    }
    
    return result
  }, [semiMajorAxis, eccentricity, inclination])
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
    />
  )
}

export function OrbitalPlane({ radius = 50, color = '#a855f7', opacity = 0.1 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005
    }
  })
  
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.5, radius, 64]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  )
}

export function GravityWell({ position = [0, 0, 0], mass = 100, radius = 5 }) {
  const ringRef = useRef()
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      ringRef.current.scale.set(scale, scale, 1)
    }
  })
  
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius * 0.2, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[radius * 0.3, radius, 32]} />
        <meshBasicMaterial 
          color="#a855f7" 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line
        points={Array.from({ length: 33 }, (_, i) => {
          const angle = (i / 32) * Math.PI * 2
          return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
        })}
        color="#a855f7"
        lineWidth={0.5}
        transparent
        opacity={0.5}
      />
    </group>
  )
}