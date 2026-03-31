import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'
import Planet from './Planet'
import InstancedStarField from './InstancedStarField'
import VolumetricNebula from './VolumetricNebula'
import ContributionWaves from './ContributionWaves'
import CometSystem from './CometSystem'
import AsteroidBelt from './AsteroidBelt'
import CentralStar from './CentralStar'
import SpaceDust from './SpaceDust'
import { WormholeRing } from './Wormhole'
import LensFlareSystem from './LensFlare'
import HyperspaceWarp from './HyperspaceWarp'
import SciFiHUD, { TargetReticle, CoordinateGrid } from './SciFiHUD'
import { OrbitPath, OrbitalPlane, GravityWell } from './OrbitalMechanics'
import { ParticleRing, EnergyBeam } from './ParticleAccelerator'
import { PhasedMoon, SunWithCorona, BinaryStarSystem } from './CelestialBodies'
import { MissionLog, ActivityFeed } from './MissionLog'

export default function Galaxy() {
  const groupRef = useRef()
  const { repositories, getFilteredRepositories, selectedRepo, userData, isLoading, timelinePosition } = useStore()
  const filteredRepos = getFilteredRepositories()
  
  const timeScale = 1 + timelinePosition * 10
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00003 * timeScale
    }
  })
  
  return (
    <group ref={groupRef}>
      <InstancedStarField count={50000} radius={600} />
      <VolumetricNebula />
      <ContributionWaves />
      <CometSystem count={100} />
      <AsteroidBelt innerRadius={20} outerRadius={80} count={20000} />
      <CentralStar />
      <SunWithCorona position={[150, 120, -150]} radius={18} color="#fff4e0" />
      <PhasedMoon position={[-80, 50, -80]} radius={4} phase={0.5} color="#e8e8e8" />
      <PhasedMoon position={[100, -30, -100]} radius={2.5} phase={0.7} color="#d0d0d0" />
      <BinaryStarSystem position={[-130, 50, -130]} star1Radius={6} star2Radius={4} color1="#ff6600" color2="#ffcc00" orbitSpeed={0.2} />
      <SpaceDust count={25000} bounds={400} />
      <LensFlareSystem />
      <CoordinateGrid size={300} divisions={60} />
      <OrbitalPlane radius={120} />
      <GravityWell position={[0, -20, 0]} mass={2000} radius={20} />
      
      <WormholeRing position={[-200, 60, -150]} scale={20} />
      <WormholeRing position={[200, -40, -180]} scale={16} />
      <WormholeRing position={[0, 80, -250]} scale={25} />
      <WormholeRing position={[-140, -60, -200]} scale={14} />
      <WormholeRing position={[160, 70, -180]} scale={12} />
      
      <HyperspaceWarp position={[-160, -60, -200]} scale={35} speed={3} intensity={1} />
      <HyperspaceWarp position={[170, 70, -200]} scale={35} speed={3} intensity={1} />
      
      <ParticleRing position={[-100, 40, 70]} radius={25} count={500} color="#00d4ff" />
      <ParticleRing position={[120, -30, 80]} radius={20} count={400} color="#a855f7" />
      <ParticleRing position={[0, 70, 100]} radius={22} count={450} color="#06ffa5" />
      
      <EnergyBeam startPos={[-60, 20, 50]} endPos={[-30, 10, 30]} color="#00d4ff" />
      <EnergyBeam startPos={[60, -10, 50]} endPos={[90, 20, 60]} color="#06ffa5" />
      <EnergyBeam startPos={[0, 40, 40]} endPos={[25, 25, 15]} color="#a855f7" />
      
      {filteredRepos.map((repo, index) => (
        <group key={repo.id}>
          <Planet key={repo.id} repo={repo} />
          <OrbitPath 
            semiMajorAxis={repo.orbitRadius}
            eccentricity={0.1 + Math.random() * 0.25}
            inclination={(index % 9) * 0.03}
            color={repo.languageColor}
            opacity={0.08}
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