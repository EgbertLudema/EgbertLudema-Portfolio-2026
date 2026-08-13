'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useDebugStore } from './debugStore'
import { getLocalBoundingBox } from './ModelSceneItem'

const NODE_NAME = /^Node_(\d+)$/
const EDGE_NAME = /^Edge_(\d+)_(\d+)$/
const PACKET_NAME = 'Packet'
const TARGET_SIZE = 1.4
// Upper bound on simultaneously live packets: meshes beyond the current
// idle/active count just sit hidden rather than being created/destroyed,
// so ramping the count up on focus is instant.
const MAX_PACKETS = 12

type PacketState = {
  fromNode: number
  toNode: number
  progress: number
  speedScale: number
}

type GraphInfo = {
  nodePositions: THREE.Vector3[]
  edges: [number, number][]
  edgeCurves: Map<string, THREE.CatmullRomCurve3>
}

// How many samples to bucket a bridge's tube geometry into when rebuilding
// its centerline: high enough to catch a gentle arc, coarse enough that a
// bucket always has several ring vertices in it to average out.
const CURVE_SAMPLE_COUNT = 16

/** The bridges are arced tube meshes, not straight cylinders. A plain lerp
 * between node positions cuts through empty space instead of tracing the
 * bridge. This rebuilds the tube's actual centerline by projecting every
 * vertex onto the straight node-to-node axis to bucket it by how far along
 * the bridge it sits, then averaging each bucket: since the tube's
 * cross-section is a ring centred on the centerline, the bucket average
 * cancels the radius out and leaves just the arc. */
function buildEdgeCurve(
  mesh: THREE.Mesh,
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3,
): THREE.CatmullRomCurve3 {
  const position = mesh.geometry.attributes.position
  const axis = toPos.clone().sub(fromPos)
  const axisLengthSq = axis.lengthSq() || 1

  const sums = Array.from({ length: CURVE_SAMPLE_COUNT + 1 }, () => new THREE.Vector3())
  const counts = new Array(CURVE_SAMPLE_COUNT + 1).fill(0)
  const vertex = new THREE.Vector3()

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const t = THREE.MathUtils.clamp(vertex.clone().sub(fromPos).dot(axis) / axisLengthSq, 0, 1)
    const bucket = Math.round(t * CURVE_SAMPLE_COUNT)
    sums[bucket].add(vertex)
    counts[bucket] += 1
  }

  const points: THREE.Vector3[] = []
  for (let i = 0; i <= CURVE_SAMPLE_COUNT; i++) {
    if (counts[i] > 0) points.push(sums[i].divideScalar(counts[i]))
  }
  if (points.length < 2) return new THREE.CatmullRomCurve3([fromPos.clone(), toPos.clone()])

  // Snap the ends exactly onto the node centers so packets visually land on
  // the node spheres instead of stopping just short of them.
  points[0] = fromPos.clone()
  points[points.length - 1] = toPos.clone()
  return new THREE.CatmullRomCurve3(points)
}

/** Picks a random edge touching `fromNode` and returns the node at its other
 * end, preferring not to immediately backtrack to `avoidNode` (the node the
 * packet just left) so it reads as travelling onward rather than bouncing. */
function pickNextNode(fromNode: number, edges: [number, number][], avoidNode: number): number {
  const touching = edges.filter(([a, b]) => a === fromNode || b === fromNode)
  const other = ([a, b]: [number, number]) => (a === fromNode ? b : a)
  const notBacktracking = touching.filter((edge) => other(edge) !== avoidNode)
  const pool = notBacktracking.length > 0 ? notBacktracking : touching
  const edge = pool[Math.floor(Math.random() * pool.length)]
  return other(edge)
}

/** Samples a packet's position along whichever bridge connects `fromNode`
 * and `toNode`, travelling forward or backward along it as needed. The
 * mesh names (and so the curve map's keys) only record one direction per
 * bridge. Falls back to a straight lerp if a bridge's curve wasn't built
 * (e.g. a stray edge whose nodes failed to resolve). */
function samplePacketPosition(
  edgeCurves: Map<string, THREE.CatmullRomCurve3>,
  fromNode: number,
  toNode: number,
  progress: number,
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3,
  target: THREE.Vector3,
) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1)
  const forward = edgeCurves.get(`${fromNode}-${toNode}`)
  if (forward) {
    forward.getPointAt(clamped, target)
    return
  }
  const reverse = edgeCurves.get(`${toNode}-${fromNode}`)
  if (reverse) {
    reverse.getPointAt(1 - clamped, target)
    return
  }
  target.lerpVectors(fromPos, toPos, clamped)
}

/** Renders a node/edge graph glb (nodes named `Node_N`, edges named
 * `Edge_A_B`, a template dot mesh named `Packet`) and animates a pool of
 * cloned packet dots that randomly hop from node to node along the edges,
 * a different "bridge" each time a dot arrives somewhere. Idle vs. focused
 * controls both how many dots are live and how fast they travel. */
export default function NodeGraphModel({
  modelUrl,
  focused,
  scale = 1,
  label,
}: {
  modelUrl: string
  focused: boolean
  scale?: number
  /** This project's title, becomes this instance's own Leva folder, so
   * every model gets independent sliders rather than sharing one bucket
   * with every other project of the same kind. */
  label: string
}) {
  const { scene } = useGLTF(modelUrl)
  const debugStore = useDebugStore()

  const tuning = useControls(
    label,
    {
      targetSize: { value: TARGET_SIZE, min: 0.1, max: 4, step: 0.01 },
      rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
      idlePacketCount: { value: 2, min: 0, max: MAX_PACKETS, step: 1 },
      activePacketCount: { value: 8, min: 0, max: MAX_PACKETS, step: 1 },
      idleSpeed: { value: 0.12, min: 0.01, max: 2, step: 0.01 },
      activeSpeed: { value: 0.55, min: 0.01, max: 2, step: 0.01 },
    },
    { store: debugStore ?? undefined },
  )

  const outerRef = useRef<THREE.Group>(null)
  const modelWrapRef = useRef<THREE.Group>(null)
  const packetGroupRef = useRef<THREE.Group>(null)
  const graphRef = useRef<GraphInfo>({ nodePositions: [], edges: [], edgeCurves: new Map() })
  const packetMeshesRef = useRef<THREE.Mesh[]>([])
  const packetStatesRef = useRef<PacketState[]>([])
  const pointerTiltRef = useRef({ x: 0, y: 0 })
  const currentTiltRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const nodePositions: THREE.Vector3[] = []
    const edgeEntries: { a: number; b: number; mesh: THREE.Mesh }[] = []
    let packetGeometry: THREE.BufferGeometry | null = null
    let packetMaterial: THREE.Material | null = null

    scene.traverse((child) => {
      const nodeMatch = NODE_NAME.exec(child.name)
      if (nodeMatch) nodePositions[Number(nodeMatch[1])] = child.position.clone()

      const edgeMatch = EDGE_NAME.exec(child.name)
      if (edgeMatch && (child as THREE.Mesh).isMesh) {
        edgeEntries.push({
          a: Number(edgeMatch[1]),
          b: Number(edgeMatch[2]),
          mesh: child as THREE.Mesh,
        })
      }

      if (child.name === PACKET_NAME && (child as THREE.Mesh).isMesh) {
        const packetMesh = child as THREE.Mesh
        packetGeometry = packetMesh.geometry
        packetMaterial = packetMesh.material as THREE.Material
        // The template packet stays in the scene graph (so its geometry/
        // material live somewhere stable to clone from) but never renders
        // itself: only the cloned pool below does.
        packetMesh.visible = false
      }
    })

    // Edges are traversed before nodes in this glb's node order, so curves
    // are built in a second pass once every node position is known.
    const edges: [number, number][] = edgeEntries.map(({ a, b }) => [a, b])
    const edgeCurves = new Map<string, THREE.CatmullRomCurve3>()
    edgeEntries.forEach(({ a, b, mesh }) => {
      const fromPos = nodePositions[a]
      const toPos = nodePositions[b]
      if (fromPos && toPos) edgeCurves.set(`${a}-${b}`, buildEdgeCurve(mesh, fromPos, toPos))
    })

    graphRef.current = { nodePositions, edges, edgeCurves }

    // Idempotency guard: this effect can re-run on the same cached scene
    // (useGLTF caches by url): clear any previously built pool first so a
    // second run doesn't duplicate packet meshes.
    packetGroupRef.current?.clear()
    packetMeshesRef.current = []
    packetStatesRef.current = []

    if (packetGeometry && packetMaterial && edges.length > 0) {
      for (let i = 0; i < MAX_PACKETS; i++) {
        const mesh = new THREE.Mesh(packetGeometry, packetMaterial)
        mesh.visible = false
        packetGroupRef.current?.add(mesh)
        packetMeshesRef.current.push(mesh)

        const [fromNode, toNode] = edges[Math.floor(Math.random() * edges.length)]
        packetStatesRef.current.push({
          fromNode,
          toNode,
          progress: Math.random(),
          speedScale: 0.7 + Math.random() * 0.6,
        })
      }
    }

    const box = getLocalBoundingBox(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const modelScale = tuning.targetSize / maxDimension

    if (modelWrapRef.current) {
      modelWrapRef.current.scale.setScalar(modelScale)
      const rotationEuler = new THREE.Euler(tuning.rotationX, tuning.rotationY, tuning.rotationZ)
      modelWrapRef.current.rotation.copy(rotationEuler)
      // Rotation happens before translation in the local transform, so the
      // centering offset must be rotated the same way to still land the
      // model's bounding-box center at this group's origin.
      const scaledCenter = center.clone().multiplyScalar(modelScale).applyEuler(rotationEuler)
      modelWrapRef.current.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z)
    }
  }, [scene, tuning.targetSize, tuning.rotationX, tuning.rotationY, tuning.rotationZ])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2
      pointerTiltRef.current.x = Math.max(-1, Math.min(1, y))
      pointerTiltRef.current.y = Math.max(-1, Math.min(1, x))
    }
    const handleBlur = () => {
      pointerTiltRef.current.x = 0
      pointerTiltRef.current.y = 0
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useFrame((_, delta) => {
    const { nodePositions, edges, edgeCurves } = graphRef.current
    if (nodePositions.length > 0 && edges.length > 0) {
      const activeCount = focused ? tuning.activePacketCount : tuning.idlePacketCount
      const baseSpeed = focused ? tuning.activeSpeed : tuning.idleSpeed

      packetMeshesRef.current.forEach((mesh, i) => {
        const isActive = i < activeCount
        mesh.visible = isActive
        if (!isActive) return

        const state = packetStatesRef.current[i]
        state.progress += delta * baseSpeed * state.speedScale
        if (state.progress >= 1) {
          const arrivedNode = state.toNode
          const departedFrom = state.fromNode
          state.fromNode = arrivedNode
          state.toNode = pickNextNode(arrivedNode, edges, departedFrom)
          state.progress = 0
          state.speedScale = 0.7 + Math.random() * 0.6
        }

        const from = nodePositions[state.fromNode]
        const to = nodePositions[state.toNode]
        if (from && to) {
          samplePacketPosition(
            edgeCurves,
            state.fromNode,
            state.toNode,
            state.progress,
            from,
            to,
            mesh.position,
          )
        }
      })
    }

    if (outerRef.current) {
      const tilt = currentTiltRef.current
      const target = pointerTiltRef.current
      tilt.x += (target.x - tilt.x) * 0.08
      tilt.y += (target.y - tilt.y) * 0.08

      outerRef.current.rotation.y = focused ? tilt.y * 0.16 : 0
      outerRef.current.rotation.x = focused ? tilt.x * 0.1 : 0
    }
  })

  return (
    <group scale={scale}>
      <group ref={outerRef}>
        <group ref={modelWrapRef}>
          <primitive object={scene} />
          <group ref={packetGroupRef} />
        </group>
      </group>
    </group>
  )
}
