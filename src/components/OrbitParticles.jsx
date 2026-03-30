import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const particleVertexShader = `
  attribute float size;
  attribute float opacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const particleFragmentShader = `
  uniform vec3 color;
  varying float vOpacity;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export default function OrbitParticles({ repo, particles, isVisible }) {
  const pointsRef = useRef()
  
  const { positions, sizes, opacities } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3)
    const sizes = new Float32Array(particles.length)
    const opacities = new Float32Array(particles.length)
    
    particles.forEach((p, i) => {
      positions[i * 3] = p.offset[0]
      positions[i * 3 + 1] = p.offset[1]
      positions[i * 3 + 2] = p.offset[2]
      sizes[i] = p.size * 100
      opacities[i] = p.opacity
    })
    
    return { positions, sizes, opacities }
  }, [particles])
  
  const color = useMemo(() => new THREE.Color(repo.languageColor), [repo.languageColor])
  
  useFrame((state) => {
    if (!pointsRef.current || !isVisible) return
    
    const time = state.clock.elapsedTime
    const positionAttr = pointsRef.current.geometry.attributes.position
    
    particles.forEach((p, i) => {
      const angle = time * p.speed * 10 + p.phase
      const x = Math.cos(angle) * (repo.scale * 2 + Math.sin(time + p.phase) * repo.scale)
      const y = p.offset[1] + Math.sin(time * 2 + p.phase) * 0.1
      const z = Math.sin(angle) * (repo.scale * 2 + Math.sin(time + p.phase) * repo.scale)
      
      positionAttr.setXYZ(i, x, y, z)
    })
    
    positionAttr.needsUpdate = true
  })
  
  if (!isVisible) return null
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={particles.length}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{
          color: { value: color }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
