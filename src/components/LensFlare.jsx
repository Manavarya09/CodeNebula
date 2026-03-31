import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const lensFlareVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lensFlareFragmentShader = `
  varying vec2 vUv;
  
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec2 uLightPos;
  
  float flareDisc(vec2 uv, float size, float softness) {
    float dist = length(uv);
    return smoothstep(size, size * softness, dist);
  }
  
  float flareRing(vec2 uv, float size, float thickness) {
    float dist = length(uv);
    return smoothstep(size - thickness, size, dist) * smoothstep(size + thickness, size, dist);
  }
  
  void main() {
    vec2 uv = vUv - 0.5;
    
    vec2 lightDir = normalize(uLightPos);
    float angle = atan(uv.y, uv.x);
    
    float flare = 0.0;
    
    flare += flareDisc(uv, 0.3, 0.8) * 0.3;
    flare += flareRing(uv, 0.25, 0.02) * 0.2;
    flare += flareRing(uv, 0.35, 0.01) * 0.15;
    flare += flareRing(uv, 0.15, 0.015) * 0.25;
    
    vec2 ghostPos = -uv * 0.5;
    float ghostDist = length(uv + uLightPos * 0.3);
    flare += flareDisc(ghostPos, 0.08, 0.9) * 0.4;
    
    vec2 ghost2Pos = -uv * 0.8;
    float ghost2Dist = length(uv + uLightPos * 0.6);
    flare += flareDisc(ghost2Pos, 0.05, 0.85) * 0.3;
    
    float pulse = 1.0 + sin(uTime * 3.0) * 0.1;
    flare *= pulse;
    
    vec3 color = uColor * flare * uIntensity;
    float alpha = flare * 0.8;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function LensFlare({ position = [0, 0, 0], color = '#ffffff', intensity = 1 }) {
  const meshRef = useRef()
  const { camera } = useThree()
  
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uTime: { value: 0 },
    uLightPos: { value: new THREE.Vector2(0, 0) }
  }), [color, intensity])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      
      const screenPos = new THREE.Vector3(...position)
      screenPos.project(camera)
      
      const x = screenPos.x
      const y = screenPos.y
      
      meshRef.current.material.uniforms.uLightPos.value.set(x, y)
      
      const distFromCenter = Math.sqrt(x * x + y * y)
      const visibility = distFromCenter < 1.2 ? 1 : 0
      meshRef.current.material.uniforms.uIntensity.value = intensity * visibility
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        vertexShader={lensFlareVertexShader}
        fragmentShader={lensFlareFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function LensFlareSystem() {
  return (
    <group>
      <LensFlare position={[0, 0, 0]} color="#fff5e6" intensity={2} />
    </group>
  )
}