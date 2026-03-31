import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Galaxy from './Galaxy'
import AdvancedCameraController from './AdvancedCameraController'
import { PerformanceMonitor } from './LODSystem'
import { SoundEffects, SpaceAudio } from './SpaceAudio'
import { KeyboardShortcuts, CommandPalette } from './KeyboardShortcuts'
import AdvancedLighting, { AdvancedPostProcessing, PhysicallyAccurateAtmosphere, VolumetricLighting } from './AdvancedRendering'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 50, 90], fov: 40, near: 0.1, far: 5000 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        sortObjects: true
      }}
      dpr={[1, 3]}
    >
      <color attach="background" args={['#000015']} />
      <fog attach="fog" args={['#000020', 150, 500]} />
      
      <Suspense fallback={null}>
        <AdvancedLighting />
        
        <ambientLight intensity={0.05} color="#4fc3f7" />
        
        <Galaxy />
        <AdvancedCameraController />
        <PerformanceMonitor />
        <SoundEffects />
        <SpaceAudio active={false} />
        <KeyboardShortcuts />
        <CommandPalette />
        
        <PhysicallyAccurateAtmosphere />
        <VolumetricLighting />
        
        <AdvancedPostProcessing />
      </Suspense>
    </Canvas>
  )
}