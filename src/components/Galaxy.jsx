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
import VolumetricClouds from './VolumetricClouds'
import QuantumParticles from './QuantumParticles'
import { DataStreams } from './QuantumParticles'
import HyperspaceWarp from './HyperspaceWarp'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0001
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={10000} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={50} />
      <AsteroidBelt innerRadius={35} outerRadius={60} count={8000} />
      <CentralStar />
      <SpaceDust count={10000} bounds={200} />
      <QuantumParticles count={3000} bounds={80} />
      <DataStreams count={200} />
      <LensFlareSystem />
      
      <WormholeRing position={[-100, 25, -70]} scale={10} />
      <WormholeRing position={[110, -20, -90]} scale={8} />
      <WormholeRing position={[0, 40, -120]} scale={12} />
      
      <HyperspaceWarp position={[-80, -30, -100]} scale={15} speed={1.5} intensity={0.6} />
      <HyperspaceWarp position={[80, 30, -100]} scale={15} speed={1.5} intensity={0.6} />
      
      {filteredRepos.map((repo) => (
        <Planet key={repo.id} repo={repo} />
      ))}
    </group>
  )
}