import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'
import Planet from './Planet'
import Starfield from './Starfield'
import VolumetricNebula from './VolumetricNebula'
import ContributionWaves from './ContributionWaves'
import CometSystem from './CometSystem'
import AsteroidBelt from './AsteroidBelt'
import CentralStar from './CentralStar'
import PlanetAtmosphere from './Atmosphere'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0002
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={5000} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={30} />
      <AsteroidBelt innerRadius={40} outerRadius={55} count={3000} />
      <CentralStar />
      
      {filteredRepos.map((repo) => (
        <Planet key={repo.id} repo={repo} />
      ))}
    </group>
  )
}
