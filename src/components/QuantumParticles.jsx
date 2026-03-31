import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const quantumVertexShader = `
  attribute float size;
  attribute float brightness;
  attribute float phase;
  attribute vec3 velocity;
  
  uniform float uTime;
  uniform float uIntensity;
  
  varying float vBrightness;
  varying float vPhase;
  
  void main() {
    vBrightness = brightness;
    vPhase = phase;
    
    vec3 pos = position;
    
    float t = uTime * 0.5 + phase;
    pos += velocity * sin(t) * 0.5;
    pos += velocity * cos(t * 0.7) * 0.3;
    
    float pulse = sin(uTime * 3.0 + phase * 6.28) * 0.3 + 0.7;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * pulse * uIntensity * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const quantumFragmentShader = `
  varying float vBrightness;
  varying float vPhase;
  
  uniform float uTime;
  uniform vec3 uColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float ring = smoothstep(0.2, 0.25, dist) * smoothstep(0.35, 0.3, dist);
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    
    float pulse = sin(uTime * 4.0 + vPhase * 6.28) * 0.3 + 0.7;
    
    float alpha = (core * 0.8 + ring * 0.4) * vBrightness * pulse;
    
    vec3 color = uColor;
    color += vec3(1.0) * core * 0.5;
    color = mix(color, vec3(1.0), ring * 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function QuantumParticles({ count = 2000, bounds = 60 }) {
  const pointsRef = useRef()
  
  const { positions, sizes, brightnesses, phases, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightnesses = new Float32Array(count)
    const phases = new Float32Array(count)
    const velocities = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.random() * bounds
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = (radius * Math.sin(phi) * Math.sin(theta)) * 0.3
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      sizes[i] = 0.5 + Math.random() * 1.5
      brightnesses[i] = 0.3 + Math.random() * 0.7
      phases[i] = Math.random()
      
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    
    return { positions, sizes, brightnesses, phases, velocities }
  }, [count, bounds])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uColor: { value: new THREE.Color('#00d4ff') }
  }), [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      pointsRef.current.rotation.y += 0.0003
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-brightness" count={count} array={brightnesses} itemSize={1} />
        <bufferAttribute attach="attributes-phase" count={count} array={phases} itemSize={1} />
        <bufferAttribute attach="attributes-velocity" count={count} array={velocities} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={quantumVertexShader}
        fragmentShader={quantumFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const streamVertexShader = `
  attribute float progress;
  attribute float speed;
  
  uniform float uTime;
  
  varying float vProgress;
  varying float vSpeed;
  
  void main() {
    vProgress = progress;
    vSpeed = speed;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 2.0 * (1.0 + speed) * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const streamFragmentShader = `
  varying float vProgress;
  varying float vSpeed;
  
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float t = fract(vProgress + uTime * vSpeed * 0.5);
    float glow = sin(t * 3.14159) * 0.5 + 0.5;
    
    float alpha = (1.0 - dist * 2.0) * glow;
    
    vec3 color = mix(uColor1, uColor2, t);
    color += vec3(1.0) * glow * 0.3;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function DataStreams({ count = 100 }) {
  const pointsRef = useRef()
  
  const { positions, progress, speed } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const progress = new Float32Array(count)
    const speed = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const startPos = [
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 80
      ]
      const endPos = [
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 80
      ]
      
      positions[i * 3] = startPos[0]
      positions[i * 3 + 1] = startPos[1]
      positions[i * 3 + 2] = startPos[2]
      
      progress[i] = Math.random()
      speed[i] = 0.5 + Math.random() * 1.5
    }
    
    return { positions, progress, speed }
  }, [count])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#00d4ff') },
    uColor2: { value: new THREE.Color('#a855f7') }
  }), [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      
      const posAttr = pointsRef.current.geometry.attributes.position
      for (let i = 0; i < count; i++) {
        progress[i] = (progress[i] + speed[i] * 0.01) % 1
        
        const startX = (i % 10 - 5) * 16
        const startZ = (Math.floor(i / 10) - 5) * 16
        const endX = startX + (Math.random() - 0.5) * 20
        const endZ = startZ + (Math.random() - 0.5) * 20
        
        posAttr.setX(i, startX + (endX - startX) * progress[i])
        posAttr.setZ(i, startZ + (endZ - startZ) * progress[i])
      }
      posAttr.needsUpdate = true
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-progress" count={count} array={progress} itemSize={1} />
        <bufferAttribute attach="attributes-speed" count={count} array={speed} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={streamVertexShader}
        fragmentShader={streamFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}