import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const AtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00d4ff'),
    uIntensity: 0.5,
    uPower: 2.0,
  },
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uPower;
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 normal = normalize(vNormal);
      
      float fresnel = pow(1.0 - abs(dot(viewDir, normal)), uPower);
      
      float glow = fresnel * uIntensity;
      
      float pulse = 1.0 + sin(uTime * 1.5) * 0.1;
      glow *= pulse;
      
      vec3 color = uColor * glow;
      
      float alpha = fresnel * 0.8;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

extend({ AtmosphereMaterial })

export function PlanetAtmosphere({ scale = 1, color = '#00d4ff', intensity = 0.5 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef} scale={scale * 1.15}>
      <sphereGeometry args={[1, 64, 64]} />
      <atmosphereMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uColor={new THREE.Color(color)}
        uIntensity={intensity}
        uPower={2.5}
      />
    </mesh>
  )
}

export default PlanetAtmosphere
