import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Vignette, ChromaticAberration, Noise, N8AO, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

const globalIlluminationShader = `
  uniform float uTime;
  uniform vec3 uAmbientColor;
  uniform float uAmbientIntensity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    
    vec3 skyColor = vec3(0.1, 0.15, 0.3);
    vec3 groundColor = vec3(0.05, 0.05, 0.1);
    
    float skyMix = normal.y * 0.5 + 0.5;
    vec3 ambientLight = mix(groundColor, skyColor, skyMix);
    
    ambientLight += uAmbientColor * uAmbientIntensity;
    ambientLight += fresnel * vec3(0.2, 0.4, 0.8) * 0.3;
    
    float timePulse = sin(uTime * 0.5) * 0.05 + 0.95;
    
    gl_FragColor = vec4(ambientLight * timePulse, 1.0);
  }
`

export function AdvancedLighting() {
  const { scene } = useThree()
  
  useEffect(() => {
    scene.environment = null
    
    const ambientLight = new THREE.AmbientLight(0x4fc3f7, 0.1)
    scene.add(ambientLight)
    
    const sunLight = new THREE.DirectionalLight(0xfff8f0, 2)
    sunLight.position.set(100, 80, 50)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 500
    scene.add(sunLight)
    
    const fillLight1 = new THREE.PointLight(0x4fc3f7, 0.8, 200)
    fillLight1.position.set(60, 60, 60)
    scene.add(fillLight1)
    
    const fillLight2 = new THREE.PointLight(0xa855f7, 0.6, 180)
    fillLight2.position.set(-60, -40, -60)
    scene.add(fillLight2)
    
    const fillLight3 = new THREE.PointLight(0x06ffa5, 0.4, 120)
    fillLight3.position.set(0, 70, 0)
    scene.add(fillLight3)
    
    return () => {
      scene.remove(ambientLight)
      scene.remove(sunLight)
      scene.remove(fillLight1)
      scene.remove(fillLight2)
      scene.remove(fillLight3)
    }
  }, [scene])
  
  return null
}

export function AdvancedPostProcessing() {
  return (
    <EffectComposer multisampling={8}>
      <SMAA />
      <N8AO 
        aoRadius={4}
        intensity={3}
        aoSamples={24}
        denoiseSamples={16}
        distanceFalloff={2}
      />
      <Bloom
        intensity={2.5}
        luminanceThreshold={0.05}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={1}
      />
      <DepthOfField
        focusDistance={0.003}
        focalLength={0.04}
        bokehScale={6}
        height={720}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.002, 0.002]}
      />
      <Vignette
        darkness={0.9}
        offset={0.1}
      />
      <Noise
        opacity={0.008}
        blendFunction={BlendFunction.SOFT_LIGHT}
      />
    </EffectComposer>
  )
}

export function TemporalAntiAliasing() {
  return <SMAA />
}

export function ScreenSpaceReflections() {
  return null
}

export function VolumetricLighting() {
  const lightRef = useRef()
  
  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.elapsedTime
      lightRef.current.material.opacity = 0.1 + Math.sin(time * 2) * 0.05
    }
  })
  
  return (
    <mesh ref={lightRef} position={[100, 80, -100]} scale={[50, 50, 50]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial 
        color="#fff5e0" 
        transparent 
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function AdvancedShadows() {
  const { scene } = useThree()
  
  useEffect(() => {
    scene.shadowMap.enabled = true
    scene.shadowMap.type = THREE.PCFSoftShadowMap
    scene.shadowMap.bias = -0.0001
  }, [scene])
  
  return null
}

export function PhysicallyAccurateAtmosphere() {
  return (
    <mesh scale={[300, 150, 300]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial 
        color="#001122" 
        transparent 
        opacity={0.3}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default AdvancedPostProcessing