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
import SpaceDust from './SpaceDust'
import { WormholeRing } from './Wormhole'
import LensFlareSystem from './LensFlare'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00015
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={8000} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={40} />
      <AsteroidBelt innerRadius={38} outerRadius={58} count={5000} />
      <CentralStar />
      <SpaceDust count={8000} bounds={180} />
      <LensFlareSystem />
      
      <WormholeRing position={[-80, 20, -60]} scale={8} />
      <WormholeRing position={[90, -15, -80]} scale={6} />
      
      {filteredRepos.map((repo) => (
        <Planet key={repo.id} repo={repo} />
      ))}
    </group>
  )
}