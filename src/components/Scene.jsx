import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Noise, N8AO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Galaxy from './Galaxy'
import AdvancedCameraController from './AdvancedCameraController'
import { PerformanceMonitor } from './LODSystem'
import { SoundEffects } from './SpaceAudio'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 40, 70], fov: 45, near: 0.1, far: 3000 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true
      }}
      dpr={[1, 2.5]}
    >
      <color attach="background" args={['#000010']} />
      <fog attach="fog" args={['#000015', 100, 350]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.05} color="#4fc3f7" />
        <directionalLight 
          position={[80, 80, 50]} 
          intensity={2} 
          color="#fff8f0"
          castShadow
        />
        <pointLight position={[60, 60, 60]} intensity={1} color="#4fc3f7" distance={250} />
        <pointLight position={[-60, -40, -60]} intensity={0.6} color="#a855f7" distance={200} />
        <pointLight position={[0, 70, 0]} intensity={0.8} color="#06ffa5" distance={150} />
        <pointLight position={[-50, 30, 50]} intensity={0.4} color="#ff6b6b" distance={100} />
        
        <Galaxy />
        <AdvancedCameraController />
        <PerformanceMonitor />
        <SoundEffects />
        
        <EffectComposer multisampling={8}>
          <N8AO 
            aoRadius={3}
            intensity={2.5}
            aoSamples={20}
            denoiseSamples={12}
          />
          <Bloom
            intensity={2.0}
            luminanceThreshold={0.08}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.9}
          />
          <DepthOfField
            focusDistance={0.005}
            focalLength={0.035}
            bokehScale={5}
            height={480}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0015, 0.0015]}
          />
          <Vignette
            darkness={0.8}
            offset={0.15}
          />
          <Noise
            opacity={0.012}
            blendFunction={BlendFunction.SOFT_LIGHT}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}