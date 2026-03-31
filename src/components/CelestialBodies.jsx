import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const moonVertexShader = `
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

const moonFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform float uTime;
  uniform float uPhase;
  uniform vec3 uColor;
  
  void main() {
    vec3 lightDir = normalize(vec3(1.0, 0.5, 0.5));
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    
    float phase = uPhase;
    float illumination = smoothstep(-0.5, 0.5, vPosition.x * (1.0 - phase));
    illumination *= smoothstep(-0.5, 0.5, vPosition.x + phase);
    
    vec3 dayColor = uColor;
    vec3 nightColor = vec3(0.05, 0.05, 0.1);
    
    vec3 color = mix(nightColor, dayColor, illumination);
    
    float terminator = smoothstep(-0.05, 0.05, vPosition.x - (phase - 0.5) * 2.0);
    color += vec3(1.0, 0.8, 0.6) * terminator * 0.3;
    
    vec3 ambient = color * 0.15;
    vec3 diffuse = color * NdotL * 0.7;
    
    gl_FragColor = vec4(ambient + diffuse, 1.0);
  }
`

export function PhasedMoon({ 
  position = [30, 20, -30], 
  radius = 2,
  phase = 0.5,
  color = '#cccccc'
}) {
  const meshRef = useRef()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPhase: { value: phase },
    uColor: { value: new THREE.Color(color) }
  }), [phase, color])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      meshRef.current.rotation.y += 0.001
    }
  })
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={moonVertexShader}
          fragmentShader={moonFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[radius * 1.02, 32, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

export function SunWithCorona({ 
  position = [100, 80, -100], 
  radius = 8,
  color = '#ffcc00'
}) {
  const coreRef = useRef()
  const coronaRef = useRef()
  const raysRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = 1 + Math.sin(time * 2) * 0.2
    }
    
    if (coronaRef.current) {
      coronaRef.current.rotation.z += 0.002
      const scale = 1 + Math.sin(time * 1.5) * 0.1
      coronaRef.current.scale.setScalar(scale)
    }
    
    if (raysRef.current) {
      raysRef.current.rotation.z -= 0.001
    }
  })
  
  return (
    <group position={position}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          roughness={0.2}
        />
      </mesh>
      
      <mesh ref={coronaRef} scale={1.3}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      
      <mesh ref={raysRef} scale={2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd00"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      <pointLight
        position={[0, 0, 0]}
        intensity={3}
        color="#fff5e0"
        distance={500}
      />
    </group>
  )
}

export function BinaryStarSystem({ 
  position = [-80, 30, -80],
  star1Radius = 4,
  star2Radius = 2.5,
  color1 = '#ff6600',
  color2 = '#ffaa00',
  orbitSpeed = 0.5
}) {
  const groupRef = useRef()
  const star1Ref = useRef()
  const star2Ref = useRef()
  const orbitRadius = 8
  
  useFrame((state) => {
    const time = state.clock.elapsedTime * orbitSpeed
    
    if (star1Ref.current) {
      star1Ref.current.position.x = Math.cos(time) * orbitRadius
      star1Ref.current.position.z = Math.sin(time) * orbitRadius
      star1Ref.current.material.emissiveIntensity = 1.2 + Math.sin(time * 3) * 0.3
    }
    
    if (star2Ref.current) {
      star2Ref.current.position.x = Math.cos(time + Math.PI) * orbitRadius * 0.7
      star2Ref.current.position.z = Math.sin(time + Math.PI) * orbitRadius * 0.7
      star2Ref.current.material.emissiveIntensity = 1 + Math.sin(time * 4) * 0.2
    }
  })
  
  return (
    <group position={position}>
      <mesh ref={star1Ref}>
        <sphereGeometry args={[star1Radius, 32, 32]} />
        <meshStandardMaterial
          color={color1}
          emissive={color1}
          emissiveIntensity={1.2}
          roughness={0.3}
        />
      </mesh>
      
      <mesh ref={star2Ref}>
        <sphereGeometry args={[star2Radius, 32, 32]} />
        <meshStandardMaterial
          color={color2}
          emissive={color2}
          emissiveIntensity={1}
          roughness={0.3}
        />
      </mesh>
      
      <pointLight position={[0, 0, 0]} intensity={2} color={color1} distance={150} />
    </group>
  )
}

export default PhasedMoon