import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

export function ScalableLODSystem({ repos = [] }) {
  const { camera } = useThree()
  const groupRef = useRef()
  const meshRefs = useRef([])
  
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), [])
  
  useFrame(() => {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(projScreenMatrix)
    
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh || !repos[index]) return
      
      const pos = new THREE.Vector3(...repos[index].position)
      const distance = camera.position.distanceTo(pos)
      
      const inFrustum = frustum.containsPoint(pos)
      
      let detailLevel = 3
      if (distance > 300 || !inFrustum) {
        detailLevel = 0
        mesh.visible = false
      } else if (distance > 150) {
        detailLevel = 1
      } else if (distance > 80) {
        detailLevel = 2
      }
      
      const targetScale = repos[index].scale * (detailLevel / 3)
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
      
      mesh.visible = distance < 300 && inFrustum
    })
  })
  
  return <group ref={groupRef} />
}

export function GPUInstancedPlanets({ repos = [] }) {
  const instancedMeshRef = useRef()
  
  const { matrices, colors } = useMemo(() => {
    const matrices = []
    const colors = []
    
    repos.forEach((repo, i) => {
      const matrix = new THREE.Matrix4()
      matrix.setPosition(...repo.position)
      matrix.scale(new THREE.Vector3(repo.scale, repo.scale, repo.scale))
      matrices.push(matrix)
      
      const color = new THREE.Color(repo.languageColor)
      colors.push(color.r, color.g, color.b)
    })
    
    return { matrices, colors }
  }, [repos])
  
  if (repos.length === 0) return null
  
  return (
    <instancedMesh ref={instancedMeshRef} args={[null, null, repos.length]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}

export function AdaptiveQuality() {
  const { gl } = useThree()
  const frameTimeRef = useRef(0)
  const [quality, setQuality] = useState(1)
  
  useFrame((state, delta) => {
    frameTimeRef.current += delta
    
    if (frameTimeRef.current > 1) {
      const fps = 1 / delta
      
      if (fps < 30 && quality > 0.5) {
        setQuality(q => Math.max(0.5, q - 0.1))
      } else if (fps > 55 && quality < 1.5) {
        setQuality(q => Math.min(1.5, q + 0.05))
      }
      
      frameTimeRef.current = 0
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2) * quality)
    }
  })
  
  return null
}

export function MemoryOptimizedLoader() {
  const { repositories, timelinePosition, activeFilter, searchQuery } = useStore()
  
  const visibleRepos = useMemo(() => {
    let filtered = repositories
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(repo => 
        repo.language?.toLowerCase() === activeFilter.toLowerCase()
      )
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(query)
      )
    }
    
    if (timelinePosition > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (365 - timelinePosition * 365))
      filtered = filtered.filter(repo => new Date(repo.createdAt) >= cutoffDate)
    }
    
    return filtered.slice(0, 100)
  }, [repositories, activeFilter, searchQuery, timelinePosition])
  
  return visibleRepos
}

export function CullingOptimizer() {
  const { camera } = useThree()
  const [culledCount, setCulledCount] = useState(0)
  
  const cullingBounds = useMemo(() => ({
    near: 10,
    far: 400,
    fov: 60
  }), [])
  
  useFrame(() => {
    const position = camera.position
    
    if (position.length() > cullingBounds.far) {
      setCulledCount(prev => prev + 1)
    }
  })
  
  return null
}

export function PerformanceOptimizer() {
  const [performanceMode, setPerformanceMode] = useState('high')
  
  useEffect(() => {
    window.setPerformanceMode = (mode) => {
      setPerformanceMode(mode)
      
      switch (mode) {
        case 'ultra':
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          break
        case 'high':
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
          break
        case 'medium':
          gl.setPixelRatio(1)
          break
        case 'low':
          gl.setPixelRatio(0.75)
          break
      }
    }
    
    return () => delete window.setPerformanceMode
  }, [])
  
  return null
}

import { useEffect, useState } from 'react'

export function BatchRendering({ repos = [] }) {
  const batchSize = 10
  
  const batches = useMemo(() => {
    const result = []
    for (let i = 0; i < repos.length; i += batchSize) {
      result.push(repos.slice(i, i + batchSize))
    }
    return result
  }, [repos])
  
  return null
}

export function WebGLMemoryManager() {
  const { gl } = useThree()
  
  useEffect(() => {
    const memory = gl.info.memory
    console.log('WebGL Memory:', {
      geometries: memory.geometries,
      textures: memory.textures,
      programs: memory.programs
    })
    
    return () => {
      gl.clear()
    }
  }, [gl])
  
  return null
}

export default ScalableLODSystem