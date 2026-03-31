import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function SpaceDust({ count = 5000, bounds = 150 }) {
  const pointsRef = useRef()
  
  const { positions, sizes, speeds, phases, opacities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    const opacities = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * bounds * 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2
      
      sizes[i] = 0.02 + Math.random() * 0.08
      speeds[i] = 0.01 + Math.random() * 0.05
      phases[i] = Math.random() * Math.PI * 2
      opacities[i] = 0.1 + Math.random() * 0.4
    }
    
    return { positions, sizes, speeds, phases, opacities }
  }, [count, bounds])
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    return geo
  }, [positions, sizes, speeds, phases, opacities])
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#aaccff') }
      },
      vertexShader: `
        attribute float size;
        attribute float speed;
        attribute float phase;
        attribute float opacity;
        
        varying float vOpacity;
        
        uniform float uTime;
        
        void main() {
          vOpacity = opacity;
          
          vec3 pos = position;
          pos.x += sin(uTime * speed + phase) * 0.5;
          pos.y += cos(uTime * speed * 0.5 + phase) * 0.3;
          pos.z += sin(uTime * speed * 0.7 + phase * 1.5) * 0.4;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (50.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        uniform vec3 uColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export function MicroMeteorites({ count = 100 }) {
  const groupRef = useRef()
  
  const meteors = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 100
      ],
      velocity: [
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.3
      ],
      scale: 0.1 + Math.random() * 0.2,
      opacity: 0.3 + Math.random() * 0.5,
      length: 0.5 + Math.random() * 1.5
    }))
  }, [count])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    groupRef.current.children.forEach((mesh, i) => {
      const meteor = meteors[i]
      mesh.position.x += meteor.velocity[0]
      mesh.position.y += meteor.velocity[1]
      mesh.position.z += meteor.velocity[2]
      
      if (Math.abs(mesh.position.x) > 60 || 
          Math.abs(mesh.position.y) > 30 || 
          Math.abs(mesh.position.z) > 60) {
        mesh.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 100
        )
      }
    })
  })
  
  return (
    <group ref={groupRef}>
      {meteors.map((meteor, i) => (
        <mesh key={i} position={meteor.position}>
          <sphereGeometry args={[meteor.scale, 8, 8]} />
          <meshBasicMaterial 
            color="#ff9966" 
            transparent 
            opacity={meteor.opacity}
          />
        </mesh>
      ))}
    </group>
  )
}