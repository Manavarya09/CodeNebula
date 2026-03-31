import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Noise, N8AO, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Galaxy from './Galaxy'
import AdvancedCameraController from './AdvancedCameraController'
import { PerformanceMonitor } from './LODSystem'
import { SoundEffects } from './SpaceAudio'
import { KeyboardShortcuts, CommandPalette } from './KeyboardShortcuts'
import CinematicColorGrading from './CinematicColorGrading'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 60, 120], fov: 35, near: 0.1, far: 5000 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true,
        sortObjects: true,
        preserveDrawingBuffer: true
      }}
      dpr={[1, 2.5]}
    >
      <color attach="background" args={['#020208']} />
      <fog attach="fog" args={['#020215', 200, 600]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.03} color="#4a6fa5" />
        
        <directionalLight 
          position={[150, 120, 100]} 
          intensity={2.5} 
          color="#fff8f0"
        />
        
        <pointLight position={[80, 80, 80]} intensity={1} color="#4fc3f7" distance={300} />
        <pointLight position={[-80, -50, -80]} intensity={0.8} color="#a855f7" distance={250} />
        <pointLight position={[0, 100, 0]} intensity={1} color="#06ffa5" distance={200} />
        <pointLight position={[-100, 60, 60]} intensity={0.6} color="#ff6b6b" distance={150} />
        <pointLight position={[100, -40, -100]} intensity={0.5} color="#4fc3f7" distance={150} />
        
        <Galaxy />
        
        <AdvancedCameraController />
        <PerformanceMonitor />
        <SoundEffects />
        <KeyboardShortcuts />
        <CommandPalette />
        
        <EffectComposer multisampling={8}>
          <SMAA />
          <N8AO 
            aoRadius={5}
            intensity={4}
            aoSamples={32}
            denoiseSamples={20}
            distanceFalloff={3}
          />
          <Bloom
            intensity={3}
            luminanceThreshold={0.02}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={1}
          />
          <DepthOfField
            focusDistance={0.002}
            focalLength={0.05}
            bokehScale={8}
            height={480}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0025, 0.0025]}
          />
          <Vignette
            darkness={1}
            offset={0.05}
          />
          <Noise
            opacity={0.015}
            blendFunction={BlendFunction.OVERLAY}
          />
          <CinematicColorGrading
            contrast={1.15}
            saturation={1.2}
            brightness={1.05}
            vignette={0.5}
            grain={0.04}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}