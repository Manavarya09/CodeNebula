import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const volumetricCloudVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vLocalPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const volumetricCloudFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uSunDirection;
  uniform float uDensity;
  uniform float uCoverage;
  uniform vec3 uCameraPos;
  
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;
  
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  float rayMarch(vec3 pos, vec3 dir) {
    float density = 0.0;
    float t = 0.0;
    
    for(int i = 0; i < 16; i++) {
      vec3 p = pos + dir * t;
      vec3 samplePos = p * 2.0 + vec3(uTime * 0.1, 0.0, 0.0);
      float n = fbm(samplePos);
      n = smoothstep(uCoverage - 0.3, uCoverage + 0.3, n);
      density += n * 0.1;
      t += 0.15;
      if(t > 2.0) break;
    }
    
    return density;
  }
  
  void main() {
    vec3 rayDir = normalize(vWorldPosition - uCameraPos);
    vec3 rayOrigin = vLocalPosition;
    
    float density = rayMarch(rayOrigin, rayDir);
    density *= uDensity;
    
    vec3 lightDir = normalize(uSunDirection);
    float lightDensity = rayMarch(rayOrigin, lightDir);
    float shadow = exp(-lightDensity * 2.0);
    
    vec3 ambient = uColor * 0.4;
    vec3 lit = uColor * shadow * 0.8;
    
    vec3 finalColor = ambient + lit;
    
    float ao = 1.0 - density * 0.3;
    finalColor *= ao;
    
    float edgeGlow = pow(1.0 - abs(dot(rayDir, vec3(0.0, 1.0, 0.0))), 2.0);
    finalColor += uColor * edgeGlow * 0.2;
    
    float alpha = density * 0.6;
    alpha = clamp(alpha, 0.0, 0.8);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export default function VolumetricClouds({ position = [0, 0, 0], scale = 3, color = '#ffffff', density = 0.5, coverage = 0.5 }) {
  const meshRef = useRef()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    uDensity: { value: density },
    uCoverage: { value: coverage },
    uCameraPos: { value: new THREE.Vector3() }
  }), [color, density, coverage])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      meshRef.current.material.uniforms.uCameraPos.value.copy(state.camera.position)
      meshRef.current.rotation.y += 0.001
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={volumetricCloudVertexShader}
        fragmentShader={volumetricCloudFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

export function CloudLayer({ planetScale = 1, planetPosition = [0, 0, 0], color = '#ffffff' }) {
  const groupRef = useRef()
  
  const cloudPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 8; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI - Math.PI / 2
      const radius = planetScale * 1.02
      
      positions.push([
        Math.cos(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * radius * 0.3,
        Math.cos(phi) * Math.sin(theta) * radius
      ])
    }
    return positions
  }, [planetScale])
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005
    }
  })
  
  return (
    <group ref={groupRef} position={planetPosition}>
      {cloudPositions.map((pos, i) => (
        <VolumetricClouds
          key={i}
          position={pos}
          scale={0.3 + Math.random() * 0.4}
          color={color}
          density={0.3 + Math.random() * 0.3}
          coverage={0.4 + Math.random() * 0.3}
        />
      ))}
    </group>
  )
}