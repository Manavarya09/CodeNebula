import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const hyperspaceVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const hyperspaceFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uIntensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  #define PI 3.14159265359
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    
    float speed = uSpeed * (1.0 + sin(uTime * 2.0) * 0.3);
    
    float t = uTime * speed;
    
    float warp = dist * 10.0 - t * 2.0;
    float streak = sin(warp + angle * 3.0) * 0.5 + 0.5;
    streak *= sin(warp * 1.5 - angle * 5.0 + t) * 0.5 + 0.5;
    
    vec2 distortedUV = uv * (1.0 + streak * 0.5);
    float n = fbm(distortedUV * 5.0 + t * 0.5);
    
    float stars = 0.0;
    for(int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 starUV = distortedUV * (10.0 + fi * 5.0) + vec2(t * (1.0 + fi * 0.3));
      float star = noise(starUV);
      star = pow(star, 20.0 - fi * 5.0);
      stars += star * (1.0 - fi * 0.2);
    }
    
    float tunnel = smoothstep(0.5, 0.0, dist);
    float innerGlow = smoothstep(0.3, 0.0, dist);
    
    vec3 color = mix(uColor1, uColor2, streak);
    color = mix(color, uColor3, n * 0.5);
    color += vec3(1.0) * stars * 2.0;
    color += uColor1 * innerGlow * 0.5;
    
    float alpha = (tunnel * 0.8 + stars * 0.5 + innerGlow * 0.3) * uIntensity;
    alpha *= smoothstep(0.6, 0.3, dist);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function HyperspaceWarp({ position = [0, 0, 0], scale = 20, speed = 1, intensity = 1 }) {
  const meshRef = useRef()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: speed },
    uColor1: { value: new THREE.Color('#00d4ff') },
    uColor2: { value: new THREE.Color('#a855f7') },
    uColor3: { value: new THREE.Color('#06ffa5') },
    uIntensity: { value: intensity }
  }), [speed, intensity])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} rotation={[0, 0, 0]}>
      <planeGeometry args={[scale, scale]} />
      <shaderMaterial
        vertexShader={hyperspaceVertexShader}
        fragmentShader={hyperspaceFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function HyperspaceTunnel({ active = false }) {
  const groupRef = useRef()
  const { camera } = useThree()
  const initialPosition = useRef(new THREE.Vector3(0, 40, 70))
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    if (active) {
      const time = state.clock.elapsedTime
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      camera.position.add(forward.multiplyScalar(0.5))
      
      groupRef.current.children.forEach((child, i) => {
        if (child.material && child.material.uniforms) {
          child.material.uniforms.uSpeed.value = 3 + i * 0.5
          child.material.uniforms.uIntensity.value = 0.8 + Math.sin(time * 3 + i) * 0.2
        }
      })
    } else {
      camera.position.lerp(initialPosition.current, 0.02)
    }
  })
  
  if (!active) return null
  
  return (
    <group ref={groupRef}>
      <HyperspaceWarp position={[0, 0, -50]} scale={40} speed={2} intensity={1} />
      <HyperspaceWarp position={[10, 5, -40]} scale={25} speed={2.5} intensity={0.7} />
      <HyperspaceWarp position={[-10, -5, -40]} scale={25} speed={2.5} intensity={0.7} />
    </group>
  )
}