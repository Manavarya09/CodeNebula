import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const acceleratorVertexShader = `
  attribute float progress;
  attribute float speed;
  attribute float size;
  
  uniform float uTime;
  
  varying float vProgress;
  varying float vSpeed;
  
  void main() {
    vProgress = progress;
    vSpeed = speed;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (1.0 + sin(uTime * speed * 10.0 + progress * 6.28) * 0.5) * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const acceleratorFragmentShader = `
  varying float vProgress;
  varying float vSpeed;
  
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uIntensity;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float t = fract(vProgress + uTime * vSpeed);
    float glow = sin(t * 3.14159);
    
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float ring = smoothstep(0.3, 0.4, dist) * smoothstep(0.5, 0.4, dist);
    
    float alpha = (core * 0.9 + ring * 0.6) * glow * uIntensity;
    
    vec3 color = mix(uColor1, uColor2, t);
    color += vec3(1.0) * core * 0.8;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function ParticleAccelerator({ 
  startPos = [-50, 0, 0], 
  endPos = [50, 0, 0],
  count = 500,
  color1 = '#00d4ff',
  color2 = '#a855f7',
  radius = 2
}) {
  const pointsRef = useRef()
  
  const { positions, progress, speed, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const progress = new Float32Array(count)
    const speed = new Float32Array(count)
    const sizes = new Float32Array(count)
    
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    const direction = end.clone().sub(start)
    const length = direction.length()
    direction.normalize()
    
    for (let i = 0; i < count; i++) {
      const t = i / count
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * radius * (1 - t * 0.5)
      
      const pos = start.clone().add(direction.clone().multiplyScalar(t * length))
      pos.x += Math.cos(angle) * r
      pos.y += Math.sin(angle) * r
      
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
      
      progress[i] = t
      speed[i] = 0.5 + Math.random() * 1.5
      sizes[i] = 1 + Math.random() * 2
    }
    
    return { positions, progress, speed, sizes }
  }, [startPos, endPos, count, radius])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(color1) },
    uColor2: { value: new THREE.Color(color2) },
    uIntensity: { value: 1 }
  }), [color1, color2])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    
    const posAttr = pointsRef.current.geometry.attributes.position
    const progressAttr = pointsRef.current.geometry.attributes.progress
    
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    const direction = end.clone().sub(start)
    const length = direction.length()
    direction.normalize()
    
    for (let i = 0; i < count; i++) {
      progressAttr.array[i] = (progressAttr.array[i] + speed[i] * 0.01) % 1
      
      const t = progressAttr.array[i]
      const angle = Math.acos(1 - Math.random() * 2)
      const phi = Math.random() * Math.PI * 2
      const r = radius * (1 - t * 0.7) * Math.sin(angle)
      
      const pos = start.clone().add(direction.clone().multiplyScalar(t * length))
      pos.x += Math.sin(angle) * Math.cos(phi) * r
      pos.y += Math.sin(angle) * Math.sin(phi) * r
      pos.z += Math.cos(angle) * r * 0.5
      
      posAttr.setXYZ(i, pos.x, pos.y, pos.z)
    }
    
    posAttr.needsUpdate = true
    progressAttr.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-progress" count={count} array={progress} itemSize={1} />
        <bufferAttribute attach="attributes-speed" count={count} array={speed} itemSize={1} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={acceleratorVertexShader}
        fragmentShader={acceleratorFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function ParticleRing({ 
  position = [0, 0, 0], 
  radius = 10, 
  count = 200,
  color = '#00d4ff'
}) {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += 0.005
      groupRef.current.rotation.y += 0.003
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      <ParticleAccelerator
        startPos={[-radius, 0, 0]}
        endPos={[radius, 0, 0]}
        count={count}
        color1={color}
        color2="#ffffff"
        radius={1}
      />
      <ParticleAccelerator
        startPos={[0, -radius, 0]}
        endPos={[0, radius, 0]}
        count={count}
        color1={color}
        color2="#ffffff"
        radius={1}
      />
      <ParticleAccelerator
        startPos={[0, 0, -radius]}
        endPos={[0, 0, radius]}
        count={count}
        color1={color}
        color2="#ffffff"
        radius={1}
      />
    </group>
  )
}

export function EnergyBeam({ 
  startPos = [0, 0, 0], 
  endPos = [30, 0, 0],
  color = '#00d4ff'
}) {
  const beamRef = useRef()
  
  useFrame((state) => {
    if (beamRef.current) {
      const time = state.clock.elapsedTime
      beamRef.current.material.opacity = 0.3 + Math.sin(time * 10) * 0.2
    }
  })
  
  const direction = useMemo(() => {
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    return end.sub(start)
  }, [startPos, endPos])
  
  const length = direction.length()
  const midPoint = useMemo(() => {
    const start = new THREE.Vector3(...startPos)
    const end = new THREE.Vector3(...endPos)
    return start.add(end).multiplyScalar(0.5)
  }, [startPos, endPos])
  
  const rotation = useMemo(() => {
    const dir = direction.clone().normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    return [euler.x, euler.y, euler.z]
  }, [direction])
  
  return (
    <mesh ref={beamRef} position={midPoint} rotation={rotation}>
      <cylinderGeometry args={[0.1, 0.3, length, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}