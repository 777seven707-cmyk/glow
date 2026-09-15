import { Suspense, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, MeshDistortMaterial } from '@react-three/drei'
import type { Group, Mesh } from 'three'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Knot(props: ThreeElements['mesh']) {
  const mesh = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (!mesh.current || reducedMotion) return
    mesh.current.rotation.y += delta * 0.25
    mesh.current.rotation.x += delta * 0.08
    // Мягкий наклон вслед за курсором: pointer нормализован в [-1, 1].
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08
  })

  return (
    <mesh ref={mesh} castShadow {...props}>
      <torusKnotGeometry args={[1, 0.34, 220, 36]} />
      <MeshDistortMaterial
        color="#1C2E1E"
        roughness={0.15}
        metalness={0.65}
        distort={reducedMotion ? 0 : 0.28}
        speed={1.4}
      />
    </mesh>
  )
}

function Orbiters() {
  const group = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return
    group.current.rotation.y -= delta * 0.12
  })

  return (
    <group ref={group}>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <Float key={i} speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <mesh position={[Math.cos(angle) * 3, Math.sin(angle) * 1.2, Math.sin(angle) * 3]}>
              <icosahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#4D6D47" roughness={0.25} metalness={0.4} />
            </mesh>
          </Float>
        )
      })}
    </group>
  )
}

export default function Scene3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 6], fov: 42 }}
      frameloop={reducedMotion ? 'demand' : 'always'}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#FAFBF9']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} castShadow />
      <Suspense fallback={null}>
        {/* Композиция сдвинута вправо: слева на этой странице лежит заголовок. */}
        <group position={[1.9, 0.2, 0]}>
          <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.6}>
            <Knot scale={0.92} />
          </Float>
          <Orbiters />
        </group>
        <ContactShadows position={[1.9, -2, 0]} opacity={0.32} scale={12} blur={2.6} far={4} />
        {/* Окружение собрано из lightformer'ов, а не из preset: preset тянет HDR
            с внешнего CDN — лишний сетевой запрос и отказ при недоступности. */}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 10, 1]} />
          <Lightformer intensity={1.2} position={[-5, 1, 2]} scale={[6, 6, 1]} color="#dfe6df" />
          <Lightformer intensity={1.6} position={[5, -1, 3]} scale={[6, 6, 1]} color="#ffffff" />
        </Environment>
      </Suspense>
    </Canvas>
  )
}
