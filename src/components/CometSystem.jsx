import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const cometVertexShader = `
  attribute float size;
  attribute float brightness;
  attribute float trailIndex;
  
  uniform float uTime;
  
  varying float vBrightness;
  varying float vTrailIndex;
  
  void main() {
    vBrightness = brightness;
    vTrailIndex = trailIndex;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const cometFragmentShader = `
  varying float vBrightness;
  varying float vTrailIndex;
  
  uniform vec3 uColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vBrightness;
    
    vec3 color = mix(uColor, vec3(1.0), vTrailIndex * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function CometSystem({ count = 50 }) {
  const pointsRef = useRef()
  
  const { positions, sizes, brightnesses, trailIndices, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 50 * 3)
    const sizes = new Float32Array(count * 50)
    const brightnesses = new Float32Array(count * 50)
    const trailIndices = new Float32Array(count * 50)
    const velocities = []
    const phases = []
    
    for (let c = 0; c < count; c++) {
      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 150
      )
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.3
      ).normalize().multiplyScalar(0.2 + Math.random() * 0.3)
      
      velocities.push({ pos: startPos.clone(), vel: velocity })
      phases.push(Math.random() * Math.PI * 2)
      
      for (let t = 0; t < 50; t++) {
        const idx = c * 50 + t
        const trailPos = startPos.clone().sub(velocity.clone().multiplyScalar(t * 0.5))
        
        positions[idx * 3] = trailPos.x
        positions[idx * 3 + 1] = trailPos.y
        positions[idx * 3 + 2] = trailPos.z
        
        sizes[idx] = (1.0 - t / 50) * 3.0
        brightnesses[idx] = (1.0 - t / 50) * 0.8
        trailIndices[idx] = t / 50
      }
    }
    
    return { positions, sizes, brightnesses, trailIndices, velocities, phases }
  }, [count])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const time = state.clock.elapsedTime
    const positionAttr = pointsRef.current.geometry.attributes.position
    
    for (let c = 0; c < count; c++) {
      const vel = velocities[c]
      const phase = phases[c]
      
      vel.pos.add(vel.vel)
      
      if (vel.pos.length() > 100) {
        vel.pos.set(
          (Math.random() - 0.5) * 150,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 150
        )
      }
      
      for (let t = 0; t < 50; t++) {
        const idx = c * 50 + t
        const offset = vel.vel.clone().multiplyScalar(-t * 0.5)
        
        const wobble = Math.sin(time * 2 + phase + t * 0.2) * 0.5
        
        positionAttr.setXYZ(
          idx,
          vel.pos.x + offset.x + wobble,
          vel.pos.y + offset.y,
          vel.pos.z + offset.z + wobble
        )
      }
    }
    
    positionAttr.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * 50}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count * 50}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-brightness"
          count={count * 50}
          array={brightnesses}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-trailIndex"
          count={count * 50}
          array={trailIndices}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={cometVertexShader}
        fragmentShader={cometFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#00d4ff') }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
