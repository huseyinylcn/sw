import { useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ConnectionMode,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useParams } from 'react-router-dom'
import { getScript } from '../services/DesignService'
import { ImageNode, JunctionNode } from './Design.jsx'

const nodeTypes = { imageNode: ImageNode, junctionNode: JunctionNode }

// When a scenario is saved, the selection is baked into the styles: edges "cut off"
// by the selection are dimmed (lower opacity) and inactive products get data.dimmed.
// Here we recognize the dimmed ones from those traces.
const isEdgeDimmed = (e) => e.style?.opacity != null && e.style.opacity < 0.5
const isNodeDimmed = (n) => n.data?.dimmed === true
const isEdgeActive = (e) => e.className === 'edge-flow'

// Active edge style in the scenario — same as the one applied to the selected edge in Design
const activeEdgeStyle = (e) => ({
  ...e,
  className: 'edge-flow',
  style: { ...e.style, stroke: '#22d3ee', strokeWidth: 3, opacity: 1, strokeDasharray: '8 6' },
})

// Faded (passive) edge style: no animation, dimmed so it reads as "not carrying current".
// opacity < 0.5 also makes isEdgeDimmed() true -> it's hidden in "Active only" mode.
const fadedEdgeStyle = (e) => ({
  ...e,
  style: { ...e.style, opacity: 0.35 },
})

// If the handles on both ends of an edge carry a single wire, that connection is "fixed":
// there is no alternative to choose (the backend does not count it as a switch either), so
// current always flows through it -> render it animated like an active edge.
const handleKey = (nodeId, handleId) => `${nodeId}:${handleId}`
// Label match — used ONLY to decide which edges to fade (a Klemens terminal not already
// on an active path). Node dimming below does NOT use the label, just the faded edges.
const isKlemens = (n) => (n.data?.label ?? '').trim().toLowerCase().includes('klemens')
function markFixedEdges(nodes, edges) {
  const counts = {}
  const count = (k) => { counts[k] = (counts[k] ?? 0) + 1 }
  edges.forEach((e) => {
    count(handleKey(e.source, e.sourceHandle))
    count(handleKey(e.target, e.targetHandle))
  })

  const klemensIds = new Set(nodes.filter(isKlemens).map((n) => n.id))
  // A Klemens already touched by an active edge stays animated -> exception doesn't apply.
  const activeNodes = new Set()
  edges.forEach((e) => {
    if (!isEdgeActive(e)) return
    activeNodes.add(e.source)
    activeNodes.add(e.target)
  })
  const idleKlemens = new Set([...klemensIds].filter((id) => !activeNodes.has(id)))
  const touchesIdleKlemens = (e) => idleKlemens.has(e.source) || idleKlemens.has(e.target)

  // Endpoints of the edges we fade -> these get dimmed. No label check here: whatever nodes
  // sit on a faded edge get dimmed.
  const fadedNodeIds = new Set()

  const outEdges = edges.map((e) => {
    // older scenarios may have the arrow head baked into the edge -> drop it
    const { markerEnd, markerStart, ...clean } = e
    if (isEdgeActive(clean) || isEdgeDimmed(clean)) return clean // decided by the selection -> leave alone
    const isSingle =
      counts[handleKey(clean.source, clean.sourceHandle)] === 1 &&
      counts[handleKey(clean.target, clean.targetHandle)] === 1
    if (isSingle && touchesIdleKlemens(clean)) {
      fadedNodeIds.add(clean.source)
      fadedNodeIds.add(clean.target)
      return fadedEdgeStyle(clean) // idle Klemens edge -> faded, not animated
    }
    return isSingle ? activeEdgeStyle(clean) : clean
  })

  // Dim the source/target nodes of every faded edge, unless the node still carries current.
  const outNodes = nodes.map((n) =>
    fadedNodeIds.has(n.id) && !activeNodes.has(n.id)
      ? { ...n, data: { ...n.data, dimmed: true } }
      : n,
  )

  return { nodes: outNodes, edges: outEdges }
}

// Read-only scenario viewer: renders the nodes + edges coming from the backend.
// No designing happens here -> all editing/interaction is disabled.
function ScenarioInner() {
  const { id } = useParams()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  // when on: dimmed (unselected) products and edges are hidden entirely
  const [activeOnly, setActiveOnly] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getScript({ id })
      .then((res) => {
        const item = Array.isArray(res) ? res[0] : res
        if (!item) return
        setName(item.Name ?? '')

        // the "design" field may arrive as a string or an object -> parse it
        const raw = item.design ?? item.canvas_data
        let record = {}
        if (raw) {
          try {
            record = typeof raw === 'string' ? JSON.parse(raw) : raw
          } catch (e) {
            console.error('could not parse scenario data:', e)
          }
        }
        const processed = markFixedEdges(record.nodes ?? [], record.edges ?? [])
        setNodes(processed.nodes)
        setEdges(processed.edges)
      })
      .finally(() => setLoading(false))
  }, [id])

  // With "Active only" on, drop the dimmed ones; also drop remaining edges whose
  // endpoints are hidden so that no edge dangles into empty space.
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!activeOnly) return { visibleNodes: nodes, visibleEdges: edges }
    const keptNodes = nodes.filter((n) => !isNodeDimmed(n))
    const nodeIds = new Set(keptNodes.map((n) => n.id))
    const keptEdges = edges.filter(
      (e) => !isEdgeDimmed(e) && nodeIds.has(e.source) && nodeIds.has(e.target),
    )
    return { visibleNodes: keptNodes, visibleEdges: keptEdges }
  }, [nodes, edges, activeOnly])

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #dce3ee 0%, #c6d1e2 100%)' }}>
      {/* selected (active) edge animation — same as on the Design page */}
      <style>{`
        .edge-flow .react-flow__edge-path {
          animation: edge-flow-dash 0.55s linear infinite;
          filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.9)) drop-shadow(0 0 6px rgba(34, 211, 238, 0.5));
        }
        @keyframes edge-flow-dash {
          to { stroke-dashoffset: -14; }
        }
      `}</style>

      <ReactFlow
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        nodes={visibleNodes}
        edges={visibleEdges}
        // inert: editing / connecting / selecting are off, view only
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesUpdatable={false}
        defaultEdgeOptions={{
          style: { stroke: '#334155', strokeWidth: 2.5 },
        }}
        minZoom={0.2}
        maxZoom={4}
        fitView
        style={{ background: 'transparent' }}
      >
        <Background color="#7d8ba5" gap={24} size={1.7} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* scenario name badge + "active only" toggle at the top */}
      <div
        style={{
          position: 'fixed', left: '50%', top: 24, transform: 'translateX(-50%)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10,
            background: '#fff', border: '1px solid #e2e8f0',
            fontSize: 14, color: '#1e293b',
            boxShadow: '0 8px 20px -8px rgba(15,23,42,0.35)',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Scenario:</span>
          <span style={{ fontWeight: 600 }}>{loading ? 'Loading…' : (name || '—')}</span>
        </div>

        <label
          title="Hide unselected products and connections entirely"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderRadius: 10,
            background: '#fff', border: '1px solid #e2e8f0',
            fontSize: 13, color: '#1e293b', cursor: 'pointer', userSelect: 'none',
            boxShadow: '0 8px 20px -8px rgba(15,23,42,0.35)',
          }}
        >
          <span style={{ fontWeight: 600 }}>Active only</span>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          {/* toggle visual */}
          <span
            style={{
              position: 'relative', width: 38, height: 22, borderRadius: 11, flexShrink: 0,
              background: activeOnly ? '#16a34a' : '#cbd5e1',
              transition: 'background 0.18s ease',
            }}
          >
            <span
              style={{
                position: 'absolute', top: 3, left: activeOnly ? 19 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(15,23,42,0.35)',
                transition: 'left 0.18s ease',
              }}
            />
          </span>
        </label>
      </div>
    </div>
  )
}

function Scenario() {
  return (
    <ReactFlowProvider>
      <ScenarioInner />
    </ReactFlowProvider>
  )
}

export default Scenario
