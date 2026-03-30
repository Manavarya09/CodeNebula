import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const starVertexShader = `
  attribute float size;
  attribute float brightness;
  attribute float twinkleSpeed;
  attribute float twinkleOffset;
  attribute vec3 starColor;
  
  varying float vBrightness;
  varying float vTwinkleSpeed;
  varying float vTwinkleOffset;
  varying vec3 vStarColor;
  
  uniform float uTime;
  
  void main() {
    vBrightness = brightness;
    vTwinkleSpeed = twinkleSpeed;
    vTwinkleOffset = twinkleOffset;
    vStarColor = starColor;
    
    float twinkle = sin(uTime * twinkleSpeed + twinkleOffset) * 0.3 + 0.7;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * twinkle * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying float vBrightness;
  varying float vTwinkleSpeed;
  varying float vTwinkleOffset;
  varying vec3 vStarColor;
  
  uniform float uTime;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float twinkle = sin(uTime * vTwinkleSpeed + vTwinkleOffset) * 0.3 + 0.7;
    
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vBrightness * twinkle;
    
    vec3 color = vStarColor;
    
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    color += vec3(1.0) * core * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function Starfield({ count = 5000 }) {
  const pointsRef = useRef()
  
  const { positions, sizes, brightnesses, twinkleSpeeds, twinkleOffsets, starColors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightnesses = new Float32Array(count)
    const twinkleSpeeds = new Float32Array(count)
    const twinkleOffsets = new Float32Array(count)
    const starColors = new Float32Array(count * 3)
    
    const colorPalette = [
      [1.0, 1.0, 1.0],
      [0.8, 0.9, 1.0],
      [1.0, 0.95, 0.8],
      [0.9, 1.0, 0.95],
      [1.0, 0.8, 0.9],
    ]
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 100 + Math.random() * 150
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = (radius * Math.sin(phi) * Math.sin(theta)) * 0.4
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      sizes[i] = 0.3 + Math.random() * 2.5
      brightnesses[i] = 0.2 + Math.random() * 0.8
      twinkleSpeeds[i] = 0.5 + Math.random() * 3.0
      twinkleOffsets[i] = Math.random() * Math.PI * 2
      
      const colorChoice = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      const colorIntensity = 0.7 + Math.random() * 0.3
      starColors[i * 3] = colorChoice[0] * colorIntensity
      starColors[i * 3 + 1] = colorChoice[1] * colorIntensity
      starColors[i * 3 + 2] = colorChoice[2] * colorIntensity
    }
    
    return { positions, sizes, brightnesses, twinkleSpeeds, twinkleOffsets, starColors }
  }, [count])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00005
      pointsRef.current.rotation.x += 0.00002
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-brightness"
          count={count}
          array={brightnesses}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-twinkleSpeed"
          count={count}
          array={twinkleSpeeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-twinkleOffset"
          count={count}
          array={twinkleOffsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-starColor"
          count={count}
          array={starColors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
