import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'
import Planet from './Planet'
import Starfield from './Starfield'
import Nebula from './Nebula'
import ContributionWaves from './ContributionWaves'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={3000} />
      <Nebula />
      <ContributionWaves />
      
      {filteredRepos.map((repo) => (
        <Planet key={repo.id} repo={repo} />
      ))}
      
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#16213e" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
