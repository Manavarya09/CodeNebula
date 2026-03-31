import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

const starFieldVertexShader = `
  attribute float size;
  attribute float brightness;
  attribute vec3 starColor;
  attribute float temperature;
  
  uniform float uTime;
  
  varying vec3 vColor;
  varying float vBrightness;
  varying float vTemperature;
  
  void main() {
    vColor = starColor;
    vBrightness = brightness;
    vTemperature = temperature;
    
    float twinkle = sin(uTime * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.3 + 0.7;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (500.0 / -mvPosition.z) * twinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFieldFragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  varying float vTemperature;
  
  uniform float uTime;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    float glow = exp(-dist * 4.0);
    float core = exp(-dist * 10.0);
    
    vec3 color = vColor;
    
    vec3 temperatureColor;
    if (vTemperature < 0.3) {
      temperatureColor = vec3(1.0, 0.5, 0.3);
    } else if (vTemperature < 0.5) {
      temperatureColor = vec3(1.0, 0.8, 0.6);
    } else if (vTemperature < 0.7) {
      temperatureColor = vec3(1.0, 1.0, 0.9);
    } else {
      temperatureColor = vec3(0.8, 0.9, 1.0);
    }
    
    color = mix(color, temperatureColor, vTemperature * 0.5);
    
    color += vec3(1.0, 0.9, 0.7) * core;
    color *= vBrightness * glow;
    
    float alpha = glow * vBrightness;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function InstancedStarField({ count = 50000, radius = 500 }) {
  const pointsRef = useRef()
  const { camera } = useThree()
  
  const { positions, sizes, brightnesses, starColors, temperatures } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brightnesses = new Float32Array(count)
    const starColors = new Float32Array(count * 3)
    const temperatures = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.3 + Math.random() * 0.7)
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      sizes[i] = 0.5 + Math.random() * 3.0
      brightnesses[i] = 0.3 + Math.random() * 0.7
      temperatures[i] = Math.random()
      
      const colorChoice = Math.random()
      if (colorChoice < 0.1) {
        starColors[i * 3] = 1.0
        starColors[i * 3 + 1] = 0.4
        starColors[i * 3 + 2] = 0.3
      } else if (colorChoice < 0.3) {
        starColors[i * 3] = 1.0
        starColors[i * 3 + 1] = 0.7
        starColors[i * 3 + 2] = 0.5
      } else if (colorChoice < 0.6) {
        starColors[i * 3] = 1.0
        starColors[i * 3 + 1] = 0.9
        starColors[i * 3 + 2] = 0.8
      } else if (colorChoice < 0.8) {
        starColors[i * 3] = 0.9
        starColors[i * 3 + 1] = 0.95
        starColors[i * 3 + 2] = 1.0
      } else {
        starColors[i * 3] = 0.7
        starColors[i * 3 + 1] = 0.8
        starColors[i * 3 + 2] = 1.0
      }
    }
    
    return { positions, sizes, brightnesses, starColors, temperatures }
  }, [count, radius])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      
      if (camera.position.length() < radius * 0.5) {
        pointsRef.current.rotation.y += 0.00002
      }
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-brightness" count={count} array={brightnesses} itemSize={1} />
        <bufferAttribute attach="attributes-starColor" count={count} array={starColors} itemSize={3} />
        <bufferAttribute attach="attributes-temperature" count={count} array={temperatures} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starFieldVertexShader}
        fragmentShader={starFieldFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default InstancedStarField