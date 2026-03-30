import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const coronaVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coronaFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);
    
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
    
    float noise = sin(vPosition.x * 10.0 + uTime * 2.0) * 
                  cos(vPosition.y * 10.0 + uTime * 1.5) * 
                  sin(vPosition.z * 10.0 + uTime * 1.8);
    
    float pulse = 1.0 + sin(uTime * 3.0) * 0.15;
    
    float alpha = fresnel * uIntensity * pulse * (1.0 + noise * 0.2);
    
    vec3 color = uColor * (1.0 + fresnel * 2.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`

const coreVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coreFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  uniform float uTime;
  uniform vec3 uColor;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vec3(0.0));
    
    float intensity = pow(0.7 - dot(vNormal, viewDir), 2.0);
    
    float noise = sin(vUv.x * 50.0 + uTime * 5.0) * 
                 cos(vUv.y * 50.0 + uTime * 4.0) * 0.1;
    
    float pulse = 1.0 + sin(uTime * 2.0) * 0.1;
    
    vec3 color = uColor * pulse * (1.0 + noise);
    color += uColor * intensity * 2.0;
    
    float alpha = 1.0;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function CentralStar() {
  const coreRef = useRef()
  const coronaRef = useRef()
  const glowRef = useRef()
  
  const coreUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffe4b5') }
  }), [])
  
  const coronaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffa500') },
    uIntensity: { value: 1.5 }
  }), [])
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (coreRef.current) {
      coreRef.current.material.uniforms.uTime.value = time
      coreRef.current.rotation.y += 0.002
    }
    
    if (coronaRef.current) {
      coronaRef.current.material.uniforms.uTime.value = time
      coronaRef.current.rotation.y -= 0.001
      coronaRef.current.rotation.z += 0.0005
    }
    
    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.1
      glowRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={coreUniforms}
          transparent
        />
      </mesh>
      
      <mesh ref={coronaRef} scale={1.3}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={coronaVertexShader}
          fragmentShader={coronaFragmentShader}
          uniforms={coronaUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh ref={glowRef} scale={2.5}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff8c00"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      <pointLight
        position={[0, 0, 0]}
        intensity={3}
        color="#fff5e6"
        distance={200}
        decay={1}
      />
    </group>
  )
}
