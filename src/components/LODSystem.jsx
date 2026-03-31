import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

const lodVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance;
  
  void main() {
    vNormal = normalMatrix * normal;
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vDistance = length(vPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lodFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance;
  
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uLODLevel;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);
    
    float distFade = smoothstep(50.0, 150.0, vDistance);
    float lodFade = 1.0 - distFade * 0.5;
    
    vec3 color = uColor * (0.5 + fresnel * 0.5);
    float alpha = uOpacity * lodFade * (1.0 - distFade * 0.3);
    
    if (uLODLevel < 0.3) {
      float grid = step(0.95, fract(vPosition.x * 0.5)) + step(0.95, fract(vPosition.y * 0.5));
      color += vec3(0.2, 0.5, 1.0) * grid * 0.3;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function LODManager({ children }) {
  const { camera } = useThree()
  const { repositories, selectedRepo, hoveredRepo } = useStore()
  
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), [])
  
  useFrame(() => {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(projScreenMatrix)
    
    repositories.forEach(repo => {
      if (!repo.position) return
      
      const pos = new THREE.Vector3(...repo.position)
      const distance = camera.position.distanceTo(pos)
      const inFrustum = frustum.containsPoint(pos)
      
      let lodLevel = 1
      if (distance > 100 || !inFrustum) {
        lodLevel = 0
      } else if (distance > 50) {
        lodLevel = 0.5
      }
      
      const el = document.querySelector(`[data-lod-repo="${repo.id}"]`)
      if (el) {
        el.dataset.lodLevel = lodLevel
      }
    })
  })
  
  return <group>{children}</group>
}

export function DistanceCulling({ objects = [] }) {
  const { camera } = useThree()
  const groupRef = useRef()
  
  useFrame(() => {
    if (!groupRef.current) return
    
    groupRef.current.children.forEach(child => {
      if (!child.userData.position) return
      
      const distance = camera.position.distanceTo(
        new THREE.Vector3(...child.userData.position)
      )
      
      const maxDistance = child.userData.maxDistance || 200
      const minDistance = child.userData.minDistance || 0
      
      const shouldRender = distance >= minDistance && distance <= maxDistance
      
      if (child.visible !== shouldRender) {
        child.visible = shouldRender
      }
    })
  })
  
  return (
    <group ref={groupRef}>
      {objects.map((obj, i) => (
        <mesh
          key={i}
          position={obj.position}
          userData={{
            position: obj.position,
            maxDistance: obj.maxDistance,
            minDistance: obj.minDistance
          }}
        >
          {obj.geometry}
          {obj.material}
        </mesh>
      ))}
    </group>
  )
}

export function InstancedLOD({ 
  count = 1000,
  maxDistance = 150,
  detailDistances = [30, 60, 100, 150]
}) {
  const meshRefs = useRef([])
  const { camera } = useThree()
  
  const instances = useMemo(() => {
    const result = []
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 20 + Math.random() * 40
      
      result.push({
        position: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta) * 0.3,
          radius * Math.cos(phi)
        ],
        scale: 0.1 + Math.random() * 0.3,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
      })
    }
    return result
  }, [count])
  
  useFrame(() => {
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      
      const distance = camera.position.distanceTo(
        new THREE.Vector3(...instances[i].position)
      )
      
      let lod = 0
      for (let d = 0; d < detailDistances.length; d++) {
        if (distance < detailDistances[d]) {
          lod = d
          break
        }
      }
      
      mesh.userData.currentLOD = lod
      
      const targetScale = instances[i].scale * (1 - lod * 0.2)
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    })
  })
  
  return (
    <group>
      {instances.map((inst, i) => (
        <mesh
          key={i}
          ref={el => meshRefs.current[i] = el}
          position={inst.position}
          rotation={inst.rotation}
          scale={inst.scale}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <shaderMaterial
            vertexShader={lodVertexShader}
            fragmentShader={lodFragmentShader}
            uniforms={{
              uColor: { value: new THREE.Color('#00d4ff') },
              uOpacity: { value: 0.5 },
              uLODLevel: { value: 1 }
            }}
            transparent
          />
        </mesh>
      ))}
    </group>
  )
}

export function ProgressiveLoading({ repos }) {
  const [loadedCount, setLoadedCount] = useState(0)
  
  useEffect(() => {
    const chunkSize = 5
    let current = 0
    
    const loadChunk = () => {
      const next = Math.min(current + chunkSize, repos.length)
      setLoadedCount(next)
      current = next
      
      if (current < repos.length) {
        setTimeout(loadChunk, 100)
      }
    }
    
    loadChunk()
  }, [repos])
  
  return loadedCount
}

import { useState } from 'react'

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const frameTimes = useRef([])
  
  useFrame((state) => {
    const now = performance.now()
    frameTimes.current.push(now)
    
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift()
    }
    
    if (frameTimes.current.length > 1) {
      const delta = frameTimes.current[frameTimes.current.length - 1] - frameTimes.current[0]
      const currentFps = (frameTimes.current.length - 1) / (delta / 1000)
      setFps(Math.round(currentFps))
    }
  })
  
  return null
}