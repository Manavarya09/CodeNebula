import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const asteroidVertexShader = `
  attribute float size;
  attribute float rotationSpeed;
  attribute vec3 rotationAxis;
  
  uniform float uTime;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  mat3 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
  }
  
  void main() {
    vNormal = normal;
    vPosition = position;
    
    float rotAngle = uTime * rotationSpeed;
    mat3 rot = rotationMatrix(rotationAxis, rotAngle);
    vec3 rotatedPos = rot * position;
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
    gl_PointSize = size * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const asteroidFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform vec3 uColor;
  
  float random(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float noise = random(vPosition);
    vec3 color = uColor * (0.6 + noise * 0.4);
    
    float lighting = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 0.5)));
    color *= 0.4 + lighting * 0.6;
    
    float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * 0.9;
    gl_FragColor = vec4(color, alpha);
  }
`

export function AsteroidField({ 
  count = 5000, 
  innerRadius = 40, 
  outerRadius = 70,
  heightVariation = 10
}) {
  const pointsRef = useRef()
  
  const { positions, sizes, rotationSpeeds, rotationAxes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const rotationSpeeds = new Float32Array(count)
    const rotationAxes = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius)
      const height = (Math.random() - 0.5) * heightVariation
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      sizes[i] = 0.2 + Math.random() * 0.8
      rotationSpeeds[i] = 0.1 + Math.random() * 2
      
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize()
      rotationAxes[i * 3] = axis.x
      rotationAxes[i * 3 + 1] = axis.y
      rotationAxes[i * 3 + 2] = axis.z
    }
    
    return { positions, sizes, rotationSpeeds, rotationAxes }
  }, [count, innerRadius, outerRadius, heightVariation])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#666666') }
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
        <bufferAttribute attach="attributes-rotationSpeed" count={count} array={rotationSpeeds} itemSize={1} />
        <bufferAttribute attach="attributes-rotationAxis" count={count} array={rotationAxes} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={asteroidVertexShader}
        fragmentShader={asteroidFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

export function CollisionField() {
  const groupRef = useRef()
  const asteroids = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      position: [
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 80
      ],
      velocity: [
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.5
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: 0.3 + Math.random() * 0.7
    }))
  }, [])
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    groupRef.current.children.forEach((mesh, i) => {
      const asteroid = asteroids[i]
      
      mesh.position.x += asteroid.velocity[0]
      mesh.position.y += asteroid.velocity[1]
      mesh.position.z += asteroid.velocity[2]
      
      mesh.rotation.x += 0.01
      mesh.rotation.y += 0.02
      
      const bounds = 50
      if (Math.abs(mesh.position.x) > bounds) asteroid.velocity[0] *= -1
      if (Math.abs(mesh.position.y) > bounds / 4) asteroid.velocity[1] *= -1
      if (Math.abs(mesh.position.z) > bounds) asteroid.velocity[2] *= -1
    })
  })
  
  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid, i) => (
        <mesh key={i} position={asteroid.position} scale={asteroid.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#555555"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

export default AsteroidField