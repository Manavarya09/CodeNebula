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
import { InstancedLOD } from './LODSystem'
import { PhasedMoon, SunWithCorona, BinaryStarSystem } from './CelestialBodies'
import AsteroidField from './AsteroidField'
import { MissionLog, ActivityFeed } from './MissionLog'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories, selectedRepo, userData, isLoading } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00005
    }
  })
  
  return (
    <group ref={groupRef}>
      <Starfield count={15000} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={80} />
      <AsteroidBelt innerRadius={25} outerRadius={70} count={15000} />
      <AsteroidField count={3000} innerRadius={60} outerRadius={90} heightVariation={15} />
      <CentralStar />
      <SunWithCorona position={[120, 100, -120]} radius={12} color="#ffdd00" />
      <PhasedMoon position={[-60, 40, -60]} radius={3} phase={0.6} color="#dddddd" />
      <PhasedMoon position={[80, -20, -80]} radius={2} phase={0.3} color="#cccccc" />
      <BinaryStarSystem position={[-100, 40, -100]} star1Radius={5} star2Radius={3} color1="#ff5500" color2="#ffaa00" orbitSpeed={0.3} />
      <SpaceDust count={20000} bounds={300} />
      <QuantumParticles count={8000} bounds={120} />
      <DataStreams count={500} />
      <LensFlareSystem />
      <InstancedLOD count={3000} />
      <CoordinateGrid size={250} divisions={50} />
      <OrbitalPlane radius={90} />
      <GravityWell position={[0, -15, 0]} mass={1000} radius={15} />
      
      <WormholeRing position={[-150, 40, -100]} scale={15} />
      <WormholeRing position={[160, -30, -120]} scale={12} />
      <WormholeRing position={[0, 60, -180]} scale={20} />
      <WormholeRing position={[-100, -50, -150]} scale={10} />
      <WormholeRing position={[120, 50, -140]} scale={10} />
      
      <HyperspaceWarp position={[-120, -50, -150]} scale={25} speed={2.5} intensity={0.8} />
      <HyperspaceWarp position={[130, 50, -150]} scale={25} speed={2.5} intensity={0.8} />
      
      <ParticleRing position={[-80, 30, 50]} radius={20} count={400} color="#00d4ff" />
      <ParticleRing position={[90, -20, 60]} radius={15} count={300} color="#a855f7" />
      <ParticleRing position={[0, 50, 80]} radius={18} count={350} color="#06ffa5" />
      
      <EnergyBeam startPos={[-50, 15, 40]} endPos={[-25, 8, 25]} color="#00d4ff" />
      <EnergyBeam startPos={[50, -8, 40]} endPos={[75, 15, 50]} color="#06ffa5" />
      <EnergyBeam startPos={[0, 30, 30]} endPos={[20, 20, 10]} color="#a855f7" />
      
      {filteredRepos.map((repo, index) => (
        <group key={repo.id}>
          <Planet key={repo.id} repo={repo} />
          <OrbitPath 
            semiMajorAxis={repo.orbitRadius}
            eccentricity={0.1 + Math.random() * 0.2}
            inclination={(index % 7) * 0.04}
            color={repo.languageColor}
            opacity={0.12}
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
      <MissionLog />
      <ActivityFeed />
    </group>
  )
}