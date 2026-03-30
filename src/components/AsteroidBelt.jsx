import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const asteroidVertexShader = `
  attribute float size;
  attribute float rotationSpeed;
  attribute float rotationOffset;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform float uTime;
  
  void main() {
    vNormal = normal;
    vPosition = position;
    
    float rotAngle = uTime * rotationSpeed + rotationOffset;
    mat3 rotationMatrix = mat3(
      cos(rotAngle), 0.0, sin(rotAngle),
      0.0, 1.0, 0.0,
      -sin(rotAngle), 0.0, cos(rotAngle)
    );
    
    vec3 rotatedPos = rotationMatrix * position;
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
    gl_PointSize = size * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const asteroidFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform vec3 uColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
    
    float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * (0.3 + noise * 0.4);
    
    vec3 color = uColor * (0.5 + noise * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function AsteroidBelt({ innerRadius = 45, outerRadius = 55, count = 2000 }) {
  const pointsRef = useRef()
  
  const { positions, sizes, rotationSpeeds, rotationOffsets, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const rotationSpeeds = new Float32Array(count)
    const rotationOffsets = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius)
      const height = (Math.random() - 0.5) * 4
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      sizes[i] = 0.3 + Math.random() * 0.7
      rotationSpeeds[i] = 0.1 + Math.random() * 0.5
      rotationOffsets[i] = Math.random() * Math.PI * 2
      
      const gray = 0.2 + Math.random() * 0.3
      colors[i * 3] = gray
      colors[i * 3 + 1] = gray
      colors[i * 3 + 2] = gray * (0.8 + Math.random() * 0.4)
    }
    
    return { positions, sizes, rotationSpeeds, rotationOffsets, colors }
  }, [count, innerRadius, outerRadius])
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002
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
          attach="attributes-rotationSpeed"
          count={count}
          array={rotationSpeeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-rotationOffset"
          count={count}
          array={rotationOffsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={asteroidVertexShader}
        fragmentShader={asteroidFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#888888') }
        }}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
