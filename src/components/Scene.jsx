import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Noise, N8AO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Galaxy from './Galaxy'
import CameraController from './CameraController'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 40, 70], fov: 50, near: 0.1, far: 2000 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      }}
      dpr={[1, 2.5]}
    >
      <color attach="background" args={['#000008']} />
      <fog attach="fog" args={['#000010', 80, 250]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.08} color="#4fc3f7" />
        <directionalLight 
          position={[50, 50, 30]} 
          intensity={1.5} 
          color="#fff5e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[50, 50, 50]} intensity={0.8} color="#4fc3f7" distance={200} />
        <pointLight position={[-50, -30, -50]} intensity={0.5} color="#a855f7" distance={150} />
        <pointLight position={[0, 60, 0]} intensity={0.6} color="#06ffa5" distance={120} />
        
        <Galaxy />
        <CameraController />
        
        <EffectComposer multisampling={8}>
          <N8AO 
            aoRadius={2}
            intensity={2}
            aoSamples={16}
            denoiseSamples={8}
          />
          <Bloom
            intensity={1.8}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.85}
          />
          <DepthOfField
            focusDistance={0.008}
            focalLength={0.03}
            bokehScale={4}
            height={720}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.001, 0.001]}
          />
          <Vignette
            darkness={0.7}
            offset={0.2}
          />
          <Noise
            opacity={0.015}
            blendFunction={BlendFunction.SOFT_LIGHT}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}