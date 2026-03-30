import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

const waveVertexShader = `
  uniform float uTime;
  uniform float uWaveProgress;
  varying float vOpacity;
  varying vec2 vUv;
  varying float vWave;
  
  void main() {
    vUv = uv;
    
    float angle = atan(position.x, position.z);
    float dist = length(position.xz);
    
    float wave = sin(angle * 8.0 - uTime * 3.0) * cos(dist * 0.1 - uTime * 2.0);
    wave += sin(angle * 12.0 + uTime * 2.0) * 0.5;
    wave += cos(angle * 6.0 - uTime * 1.5) * 0.3;
    
    vec3 newPosition = position;
    newPosition.y += wave * 3.0 * uWaveProgress;
    
    float distNorm = dist / 80.0;
    vOpacity = (1.0 - distNorm) * uWaveProgress;
    vOpacity *= smoothstep(0.0, 0.3, uWaveProgress);
    vWave = wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const waveFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uTime;
  
  varying float vOpacity;
  varying vec2 vUv;
  varying float vWave;
  
  void main() {
    float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    float dist = length(vUv - 0.5) * 2.0;
    
    vec3 color = mix(uColor, uColor2, vWave * 0.5 + 0.5);
    
    float pulse = sin(uTime * 2.0) * 0.2 + 0.8;
    
    float alpha = vOpacity * 0.6 * pulse;
    alpha *= (1.0 - dist * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function ContributionWaves() {
  const meshRef = useRef()
  const { userData, isLoading } = useStore()
  const waveProgressRef = useRef(0)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveProgress: { value: 0 },
    uColor: { value: new THREE.Color('#00d4ff') },
    uColor2: { value: new THREE.Color('#a855f7') }
  }), [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    
    if (userData && !isLoading) {
      waveProgressRef.current = Math.min(waveProgressRef.current + 0.008, 1)
    } else {
      waveProgressRef.current = Math.max(waveProgressRef.current - 0.015, 0)
    }
    
    meshRef.current.material.uniforms.uWaveProgress.value = waveProgressRef.current
    meshRef.current.rotation.y += 0.0008
  })
  
  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
        <ringGeometry args={[15, 85, 256, 8]} />
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
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8.5, 0]}>
        <ringGeometry args={[14, 86, 128, 1]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
