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
import SciFiHUD, { TargetReticle, CoordinateGrid } from './SciFiHUD'
import { OrbitPath, OrbitalPlane, GravityWell } from './OrbitalMechanics'
import { ParticleRing, EnergyBeam } from './ParticleAccelerator'
import { LODManager, InstancedLOD } from './LODSystem'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories, selectedRepo, userData, isLoading } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00008
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={12000} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={60} />
      <AsteroidBelt innerRadius={30} outerRadius={65} count={10000} />
      <CentralStar />
      <SpaceDust count={15000} bounds={250} />
      <QuantumParticles count={5000} bounds={100} />
      <DataStreams count={300} />
      <LensFlareSystem />
      <InstancedLOD count={2000} />
      <CoordinateGrid size={200} divisions={40} />
      <OrbitalPlane radius={70} />
      <GravityWell position={[0, -10, 0]} mass={500} radius={10} />
      
      <WormholeRing position={[-120, 30, -80]} scale={12} />
      <WormholeRing position={[130, -25, -100]} scale={10} />
      <WormholeRing position={[0, 50, -140]} scale={15} />
      <WormholeRing position={[-80, -40, -120]} scale={8} />
      
      <HyperspaceWarp position={[-100, -40, -120]} scale={20} speed={2} intensity={0.7} />
      <HyperspaceWarp position={[100, 40, -120]} scale={20} speed={2} intensity={0.7} />
      
      <ParticleRing position={[-60, 20, 40]} radius={15} count={300} color="#00d4ff" />
      <ParticleRing position={[70, -15, 50]} radius={12} count={250} color="#a855f7" />
      
      <EnergyBeam startPos={[-40, 10, 30]} endPos={[-20, 5, 20]} color="#00d4ff" />
      <EnergyBeam startPos={[40, -5, 30]} endPos={[60, 10, 40]} color="#06ffa5" />
      
      {filteredRepos.map((repo, index) => (
        <group key={repo.id}>
          <Planet key={repo.id} repo={repo} />
          <OrbitPath 
            semiMajorAxis={repo.orbitRadius}
            eccentricity={0.1 + Math.random() * 0.15}
            inclination={(index % 5) * 0.05}
            color={repo.languageColor}
            opacity={0.15}
          />
        </group>
      ))}
      
      {selectedRepo && (
        <TargetReticle 
          target={selectedRepo.position} 
          active={true}
        />
      )}
      
      <SciFiHUD active={!isLoading && userData} />
    </group>
  )
}