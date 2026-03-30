import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

const waveVertexShader = `
  uniform float uTime;
  uniform float uWaveProgress;
  varying float vOpacity;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    float wave = sin(position.x * 0.1 + uTime) * cos(position.z * 0.1 + uTime * 0.5);
    vec3 newPosition = position;
    newPosition.y += wave * 2.0 * uWaveProgress;
    
    float dist = length(position.xz);
    vOpacity = smoothstep(80.0, 20.0, dist) * uWaveProgress;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const waveFragmentShader = `
  uniform vec3 uColor;
  varying float vOpacity;
  varying vec2 vUv;
  
  void main() {
    float alpha = vOpacity * 0.3;
    gl_FragColor = vec4(uColor, alpha);
  }
`

export default function ContributionWaves() {
  const meshRef = useRef()
  const { userData, isLoading } = useStore()
  const waveProgressRef = useRef(0)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveProgress: { value: 0 },
    uColor: { value: new THREE.Color('#00d4ff') }
  }), [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    
    if (userData && !isLoading) {
      waveProgressRef.current = Math.min(waveProgressRef.current + 0.01, 1)
    } else {
      waveProgressRef.current = Math.max(waveProgressRef.current - 0.02, 0)
    }
    
    meshRef.current.material.uniforms.uWaveProgress.value = waveProgressRef.current
    meshRef.current.rotation.y += 0.001
  })
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <ringGeometry args={[15, 80, 128, 1]} />
      <shaderMaterial
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
