import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Galaxy from './Galaxy'
import CameraController from './CameraController'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 35, 60], fov: 55, near: 0.1, far: 1000 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        powerPreference: 'high-performance'
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#000005']} />
      <fog attach="fog" args={['#000008', 60, 180]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.1} color="#4fc3f7" />
        <pointLight position={[50, 50, 50]} intensity={1.0} color="#4fc3f7" distance={150} />
        <pointLight position={[-50, -30, -50]} intensity={0.6} color="#a855f7" distance={150} />
        <pointLight position={[0, 60, 0]} intensity={0.4} color="#06ffa5" distance={100} />
        
        <Galaxy />
        <CameraController />
        
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.8}
          />
          <DepthOfField
            focusDistance={0.01}
            focalLength={0.025}
            bokehScale={3}
            height={480}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0008, 0.0008]}
          />
          <Vignette
            darkness={0.6}
            offset={0.25}
          />
          <Noise
            opacity={0.02}
            blendFunction={BlendFunction.OVERLAY}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
