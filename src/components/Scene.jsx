import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Galaxy from './Galaxy'
import CameraController from './CameraController'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 30, 50], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#000005']} />
      <fog attach="fog" args={['#000005', 50, 150]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.15} />
        <pointLight position={[50, 50, 50]} intensity={0.8} color="#4fc3f7" />
        <pointLight position={[-50, -30, -50]} intensity={0.5} color="#a855f7" />
        
        <Galaxy />
        <CameraController />
        
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <DepthOfField
            focusDistance={0.01}
            focalLength={0.02}
            bokehScale={2}
          />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
