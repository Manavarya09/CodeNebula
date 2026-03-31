import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ringVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistFromCenter;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vDistFromCenter = length(position.xz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistFromCenter;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform vec3 uSunDirection;
  uniform float uPlanetRadius;
  uniform vec3 uPlanetPosition;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    float ringDist = (vDistFromCenter - uInnerRadius) / (uOuterRadius - uInnerRadius);
    
    float bands = sin(ringDist * 80.0 + uTime * 0.5) * 0.5 + 0.5;
    bands *= sin(ringDist * 40.0 - uTime * 0.3) * 0.5 + 0.5;
    
    float gaps = random(vec2(ringDist * 100.0, floor(vUv.x * 200.0)));
    gaps = smoothstep(0.7, 0.9, gaps);
    
    float density = 0.4 + bands * 0.5;
    density *= (1.0 - gaps * 0.3);
    
    float ringWidth = smoothstep(0.0, 0.1, ringDist) * smoothstep(1.0, 0.9, ringDist);
    density *= ringWidth;
    
    vec3 lightDir = normalize(uSunDirection);
    vec3 toPlanet = normalize(uPlanetPosition - vPosition);
    
    vec3 ringNormal = vec3(0.0, 1.0, 0.0);
    float NdotL = max(dot(ringNormal, lightDir), 0.0);
    
    vec3 planetToRing = vPosition - uPlanetPosition;
    float heightAbovePlane = abs(planetToRing.y);
    float shadow = smoothstep(uPlanetRadius * 0.8, uPlanetRadius * 1.5, heightAbovePlane);
    shadow = mix(0.3, 1.0, shadow);
    
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, ringNormal)), 2.0);
    
    vec3 baseColor = uColor * (0.6 + bands * 0.4);
    
    vec3 litColor = baseColor * (0.4 + NdotL * 0.6) * shadow;
    vec3 ambientColor = baseColor * 0.15;
    
    litColor += fresnel * uColor * 0.3;
    
    vec3 finalColor = ambientColor + litColor;
    
    float alpha = density * 0.85;
    alpha *= smoothstep(0.0, 0.05, ringDist) * smoothstep(1.0, 0.95, ringDist);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export default function RealisticRing({ 
  innerRadius = 1.5, 
  outerRadius = 2.2, 
  color = '#ffa500',
  planetRadius = 1,
  planetPosition = [0, 0, 0],
  tilt = Math.PI / 2.5
}) {
  const meshRef = useRef()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uInnerRadius: { value: innerRadius },
    uOuterRadius: { value: outerRadius },
    uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    uPlanetRadius: { value: planetRadius },
    uPlanetPosition: { value: new THREE.Vector3(...planetPosition) }
  }), [innerRadius, outerRadius, color, planetRadius, planetPosition])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      meshRef.current.rotation.z += 0.001
    }
  })
  
  return (
    <mesh ref={meshRef} rotation={[tilt, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 256]} />
      <shaderMaterial
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}