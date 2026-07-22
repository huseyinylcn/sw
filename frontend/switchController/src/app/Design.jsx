import { types } from 'joi'
import { useState ,useEffect, useCallback, useRef, useMemo} from 'react'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  updateEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ConnectionMode,
  ReactFlowProvider,
  useUpdateNodeInternals,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow'
import 'reactflow/dist/style.css'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'
import { toPng } from 'html-to-image'
import {createDesign, getDesign, updateDesign, createScript, getSerialStatus} from '../services/DesignService'


import { getProducts, getProductOptions } from '../services/productService'
import { data, useParams } from 'react-router-dom'
const PHOTO_BASE_URL = 'http://192.168.150.220:5001/uploads'

function uniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Builds a unique label for a node that's added more than once. The first copy keeps the
// plain name (e.g. "usc"); each further copy gets the next free numeric suffix ("usc1", "usc2"...).
function makeUniqueLabel(base, existingNodes) {
  const labels = new Set(existingNodes.map((n) => n.data?.label))
  if (!labels.has(base)) return base
  let i = 1
  while (labels.has(`${base}${i}`)) i++
  return `${base}${i}`
}


// Works out where a handle's label text goes based on the handle's position.
// scale: factor relative to the node's size (1 = initial size).
// pct: percentage position along the edge (for symmetric distribution around the center).
// Horizontal on the right/left edges; diagonal on the top/bottom edges — this way labels
// added side by side line up in parallel and don't overlap.
function handleLabelStyle(h, scale = 1, pct = 50) {
  const s = (v) => v * scale
  const base = {
    position: 'absolute', fontSize: s(9), color: '#475569',
    background: '#ffffffcc', padding: `0 ${s(3)}px`, borderRadius: s(3),
    whiteSpace: 'nowrap', pointerEvents: 'none',
  }
  const off = `${pct}%`
  // For diagonal labels: the rotation origin sits exactly on the handle point (translateY
  // centers the box on the edge), then the final translateX pushes the text outward along
  // the diagonal -> the dot and the text don't overlap.
  switch (h.position) {
    case Position.Right:  return { ...base, right: s(14), top: off, transform: 'translateY(-50%)' }
    case Position.Left:   return { ...base, left: s(14), top: off, transform: 'translateY(-50%)' }
    // top: steep diagonal pointing up (shifted slightly left)
    case Position.Top:    return { ...base, left: off, top: 0, transformOrigin: 'left center', transform: `translate(${s(-4)}px, -50%) rotate(-65deg) translateX(${s(10)}px)` }
    // bottom: steep diagonal pointing down (shifted slightly left)
    case Position.Bottom: return { ...base, left: off, bottom: 0, transformOrigin: 'left center', transform: `translate(${s(-4)}px, 50%) rotate(65deg) translateX(${s(10)}px)` }
    default:              return base
  }
}

// Works out the handle dot's size and its (percentage) position along the edge
function handleStyle(h, scale = 1, pct = 50) {
  const size = 8 * scale
  const dot = { width: size, height: size }
  const off = `${pct}%`
  if (h.position === Position.Left || h.position === Position.Right) return { ...dot, top: off }
  return { ...dot, left: off }
}

// Handle label: double-click to edit. Editing shows a dropdown of the product's options
// (loaded via getProductOptions); if the wanted value isn't there, "✏️ Manuel gir…" switches
// to a free-text input. Hover reveals the ✕ that deletes the handle.
const MANUAL_OPTION = '__manual__'
function HandleLabel({ nodeId, handle, onEdit, onRemove, scale = 1, pct = 50, options, onNeedOptions, productId }) {
  // A handle that was just added by the arrow buttons carries autoOpen -> it starts in edit mode
  // so the user picks a value straight away instead of being left with an empty "…".
  const autoOpen = !!handle.autoOpen
  const [editing, setEditing] = useState(autoOpen)
  const [manual, setManual] = useState(false)
  const [value, setValue] = useState(handle.label ?? '')
  const [hover, setHover] = useState(false)
  const switchingRef = useRef(false) // ignore the select's blur when we switch to manual input
  const fieldRef = useRef(null)

  const style = handleLabelStyle(handle, scale, pct)

  // Focus the field ourselves instead of using autoFocus. React implements autoFocus as a bare
  // element.focus(), which lets the browser scroll the React Flow wrapper (it is overflow:hidden,
  // so the scroll is invisible and unrecoverable) to bring the field into view. That shifts the
  // canvas while React Flow keeps using its own coordinates -> a connection dragged off a handle
  // no longer starts under the cursor. preventScroll avoids it; React Flow does the same for its
  // own focus calls.
  useEffect(() => {
    if (editing) fieldRef.current?.focus({ preventScroll: true })
  }, [editing, manual])

  // Auto-opened handles skip startEdit, so pull the product's options here instead
  useEffect(() => {
    if (autoOpen) onNeedOptions?.(productId)
  }, [autoOpen, onNeedOptions, productId])

  const startEdit = () => {
    setValue(handle.label ?? '')
    setManual(false)
    setEditing(true)
    onNeedOptions?.(productId) // lazy-load this product's options
  }

  // Leaving edit mode without a value. An auto-opened handle has never been named, so instead of
  // keeping a blank one on the node we drop it again (removeHandle also clears its edges).
  const cancel = () => {
    setEditing(false)
    if (autoOpen) onRemove?.(nodeId, handle.id)
  }

  const commit = (val) => {
    const v = (val ?? value).trim()
    setEditing(false)
    if (!v && autoOpen) { onRemove?.(nodeId, handle.id); return }
    onEdit?.(nodeId, handle.id, v)
  }

  if (editing) {
    const loading = options === 'loading'
    const list = Array.isArray(options) ? options : []

    // manual (free text) mode: type anything, Enter/blur commits, Escape cancels
    if (manual) {
      return (
        <input
          className="nodrag"
          ref={fieldRef}
          value={value}
          // the switch to manual mode is done -> stop swallowing blurs (see switchingRef)
          onFocus={() => { switchingRef.current = false }}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          style={{ ...style, pointerEvents: 'auto', width: 74 * scale, border: '1px solid #94a3b8', borderRadius: 3 * scale, padding: `0 ${2 * scale}px` }}
        />
      )
    }

    // select mode: pick one of the product's options, or switch to manual
    const inList = list.some((o) => o.Name === value)
    return (
      <select
        className="nodrag"
        ref={fieldRef}
        value={inList ? value : ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === MANUAL_OPTION) { switchingRef.current = true; setManual(true); return }
          setValue(v)
          commit(v)
        }}
        onBlur={() => {
          if (switchingRef.current) { switchingRef.current = false; return }
          cancel()
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') cancel() }}
        style={{ ...style, pointerEvents: 'auto', width: 90 * scale, border: '1px solid #94a3b8', borderRadius: 3 * scale, padding: `0 ${2 * scale}px`, background: '#fff' }}
      >
        <option value="">{loading ? 'Yükleniyor…' : '— seç —'}</option>
        {list.map((o) => (
          <option key={o.ID} value={o.Name}>{o.Name}</option>
        ))}
        <option value={MANUAL_OPTION}>✏️ Manuel gir…</option>
      </select>
    )
  }

  return (
    <span
      className="nodrag"
      style={{ ...style, pointerEvents: 'auto', cursor: 'text', display: 'inline-flex', alignItems: 'center', gap: 3 * scale }}
      onDoubleClick={startEdit}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Double-click: edit"
    >
      {handle.label || '…'}
      {hover && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(nodeId, handle.id) }}
          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 10 * scale, lineHeight: 1, padding: 0 }}
          title="Delete handle"
        >
          ✕
        </button>
      )}
    </span>
  )
}

// A node's handles + labels. Handles on each edge are distributed symmetrically around
// the center: with n of them the i-th handle -> (i+1)/(n+1) => 1 gives 50%, 2 give 33%/66%.
// The ones flagged in switchIds are switches -> blue and clickable.
function NodeHandles({ nodeId, data, scale }) {
  const handles = data.handles ?? []

  const pctById = {}
  const sideSeen = {}
  handles.forEach((h) => {
    const total = handles.filter((x) => x.position === h.position).length
    const i = sideSeen[h.position] ?? 0
    sideSeen[h.position] = i + 1
    pctById[h.id] = ((i + 1) / (total + 1)) * 100
  })

  return (
    <>
      {handles.map((h) => {
        const isSwitch = !!data.switchIds?.[h.id]
        return (
          <Handle
            key={h.id}
            type={h.type}
            position={h.position}
            id={h.id}
            onClick={(e) => {
              if (!isSwitch) return
              e.stopPropagation()
              data.onHandleClick?.(nodeId, h.id, e)
            }}
            style={{
              ...handleStyle(h, scale, pctById[h.id]),
              ...(isSwitch ? { cursor: 'pointer', background: '#2563eb', border: '2px solid #1d4ed8' } : {}),
            }}
          />
        )
      })}

      {handles.map((h) => (
        <HandleLabel
          key={`lbl-${h.id}`}
          nodeId={nodeId}
          handle={h}
          scale={scale}
          pct={pctById[h.id]}
          onEdit={data.onEditHandle}
          onRemove={data.onRemoveHandle}
          options={data.productOptions}
          onNeedOptions={data.onNeedOptions}
          productId={data.product?.ID}
        />
      ))}
    </>
  )
}

// Control panel shown next to a selected node: add handles to the edges, delete the node
function NodeControls({ nodeId, data, scale }) {
  const add = (position) => data.onAddHandle?.(nodeId, position, '')

  // button style that scales with the node size
  const btnStyle = {
    fontSize: 11 * scale, width: 22 * scale, height: 22 * scale, lineHeight: 1,
    borderRadius: 5 * scale, border: '1px solid #cbd5e1',
    background: '#f8fafc', cursor: 'pointer',
  }

  return (
    <div
      className="nodrag"
      style={{
        position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
        marginLeft: 10 * scale, display: 'flex', flexDirection: 'column', gap: 4 * scale, alignItems: 'center',
        padding: 6 * scale, background: '#fff', borderRadius: 8 * scale,
        border: '1px solid #e2e8f0', boxShadow: '0 6px 16px -8px rgba(15,23,42,0.4)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 3 * scale }}>
        <button onClick={() => add(Position.Top)}    style={btnStyle}>⬆</button>
        <button onClick={() => add(Position.Left)}   style={btnStyle}>⬅</button>
        <button onClick={() => add(Position.Right)}  style={btnStyle}>➡</button>
        <button onClick={() => add(Position.Bottom)} style={btnStyle}>⬇</button>
      </div>
      <button
        onClick={() => data.onRemoveNode?.(nodeId)}
        style={{
          width: '100%', fontSize: 10 * scale, padding: `${3 * scale}px ${6 * scale}px`, lineHeight: 1,
          borderRadius: 5 * scale, border: '1px solid #fecaca',
          background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
        }}
        title="Delete"
      >
        🗑 Delete
      </button>
    </div>
  )
}

export function ImageNode({ id, data, selected }) {
  const rootRef = useRef(null)
  const [scale, setScale] = useState(1)

  // measure the node width -> scale factor relative to the initial size (180)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setScale(Math.max(0.5, el.offsetWidth / 180))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', padding: 8, borderRadius: 8, border: '1px solid #dddddd00',
        background: '#ffffff00', textAlign: 'center',
        // product with no active handle -> inactive: dimmed + grayed out
        opacity: data.dimmed ? 0.3 : 1,
        filter: data.dimmed ? 'grayscale(0.85)' : 'none',
        transition: 'opacity 0.25s ease, filter 0.25s ease',
      }}
    >
      {/* drag-to-resize handles — only while the node is selected */}
      <NodeResizer isVisible={selected} minWidth={80} minHeight={80} keepAspectRatio />

      <img src={data.image} alt={data.label} style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, objectFit: 'contain', borderRadius: 6 }} />
      <div style={{ fontSize: 13 * scale }}>{data.label}</div>

      <NodeHandles nodeId={id} data={data} scale={scale} />
      {/* controls are visible only while the node is selected (after clicking it) */}
      {selected && <NodeControls nodeId={id} data={data} scale={scale} />}
    </div>
  )
}

// Terminal block: a passive point where wires are joined electrically.
// Like a real terminal block, each wire gets its own screw (handle) and they are all
// bridged inside. Since the backend counts switches per handle (see utils.py ->
// find_multi_connected_handles), single-wire input handles are not counted as switches;
// a relay is only produced on an output handle carrying 2+ wires.
export function JunctionNode({ id, data, selected }) {
  const rootRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setScale(Math.max(0.6, Math.min(1.6, el.offsetWidth / 160)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative', width: '100%', height: '100%',
        boxSizing: 'border-box', borderRadius: 6 * scale,
        background: 'linear-gradient(#f8fafc, #e2e8f0)',
        border: `${1.5 * scale}px solid #94a3b8`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: data.dimmed ? 0.3 : 1,
        filter: data.dimmed ? 'grayscale(0.85)' : 'none',
        transition: 'opacity 0.25s ease, filter 0.25s ease',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={60} minHeight={28} />

      <span
        style={{
          fontSize: 11 * scale, fontWeight: 600, color: '#475569',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}
      >
        {data.label || 'Terminal'}
      </span>

      <NodeHandles nodeId={id} data={data} scale={scale} />
      {selected && <NodeControls nodeId={id} data={data} scale={scale} />}
    </div>
  )
}
const initialNodes = [

]
const initialEdges = [
//   { id: 'e1-2', source: '1324234', target: '2' },
//   { id: 'e1-3', source: '1324234', target: '3' },
]

const nodeTypes = { imageNode: ImageNode, junctionNode: JunctionNode }

// Polls the serial port status at a fixed interval -> { baudrate, connected, port } | null
const SERIAL_STATUS_INTERVAL = 3000
function useSerialStatus(intervalMs = SERIAL_STATUS_INTERVAL) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await getSerialStatus()
        if (!cancelled) setStatus(res)
      } catch {
        if (!cancelled) setStatus(null) // if the backend is unreachable, treat it as not connected
      }
    }
    poll()
    const t = setInterval(poll, intervalMs)
    return () => { cancelled = true; clearInterval(t) }
  }, [intervalMs])

  return status
}

function DesignInner() {
  const { id } = useParams()
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false) // "Update" confirmation
  const [designName, setDesignName] = useState('')
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioError, setScenarioError] = useState('')
  const [scenarioSaving, setScenarioSaving] = useState(false)
  const [loadedName, setLoadedName] = useState('') // name of the design loaded by id
  const [saveError, setSaveError] = useState('')
  // "switch" data from the API (parsed): { [sourceHandleId]: { owner_node, count, connections, swicth_id } }
  const [switchData, setSwitchData] = useState({})
  // The active connection the user picked for each source handle: { [sourceHandleId]: connected_handle }
  const [selections, setSelections] = useState({})
  // Select popup opened by clicking a handle: { handleId, x, y } | null
  const [switchSelect, setSwitchSelect] = useState(null)
  // Cache of product options for handle-label dropdowns: { [productId]: 'loading' | Option[] }
  const [optionsByProduct, setOptionsByProduct] = useState({})
  const updateNodeInternals = useUpdateNodeInternals()
  const serialStatus = useSerialStatus()
  const serialConnected = serialStatus?.connected === true

  useEffect(() => {
    getProducts().then(setProducts)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  // grab an edge's end and move it to another handle (reconnect)
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => setEdges((eds) => updateEdge(oldEdge, newConnection, eds)),
    [setEdges],
  )

  // double-click an edge to delete it
  const onEdgeDoubleClick = useCallback(
    (_evt, edge) => setEdges((eds) => eds.filter((e) => e.id !== edge.id)),
    [setEdges],
  )

  // Group the handles in the switch data by node:
  // { [owner_node]: { [handleId]: true } } -> lets a node check "is this handle a switch?"
  const switchIdsByNode = useMemo(() => {
    const map = {}
    for (const [handleId, entry] of Object.entries(switchData)) {
      const node = entry?.owner_node
      if (!node) continue
      if (!map[node]) map[node] = {}
      map[node][handleId] = true
    }
    return map
  }, [switchData])

  // Open the select popup when a handle is clicked (at the cursor position)
  const onHandleClick = useCallback((_nodeId, handleId, evt) => {
    setSwitchSelect({ handleId, x: evt.clientX, y: evt.clientY })
  }, [])

  // Lazily fetch (and cache) the options of a product the first time a handle label is edited
  const ensureOptions = useCallback((productId) => {
    if (productId == null) return
    setOptionsByProduct((prev) => {
      if (prev[productId] !== undefined) return prev // already loading or loaded
      getProductOptions(productId)
        .then((res) => setOptionsByProduct((p) => ({ ...p, [productId]: Array.isArray(res) ? res : [] })))
        .catch(() => setOptionsByProduct((p) => ({ ...p, [productId]: [] })))
      return { ...prev, [productId]: 'loading' }
    })
  }, [])

  // When a connection is picked: record the active target for that source handle
  const selectConnection = useCallback((handleId, connectedHandle) => {
    setSelections((s) => ({ ...s, [handleId]: connectedHandle }))
    setSwitchSelect(null)
  }, [])

  // Clear a source handle's selection -> all edges become crisp again
  const clearSelection = useCallback((handleId) => {
    setSelections((s) => {
      const next = { ...s }
      delete next[handleId]
      return next
    })
    setSwitchSelect(null)
  }, [])

  // Label shown in the select for a connection: "Target product name — target handle label"
  const resolveConnLabel = useCallback((conn) => {
    const node = nodes.find((n) => n.id === conn.connected_node)
    const productName = node?.data?.label ?? conn.connected_node
    const handle = (node?.data?.handles ?? []).find((h) => h.id === conn.connected_handle)
    const handleLabel = handle?.label || conn.connected_handle
    return `${productName} — ${handleLabel}`
  }, [nodes])

  // Node state derived from the selections:
  // - activeNodeIds: nodes touched by an active (selected) edge
  // - dimmedNodeIds: nodes touched by an edge dimmed by a selection (i.e. the selection "cut" it)
  // A node goes inactive only if a connection touching it was cut by a selection AND it has
  // no active edge left. A node with no selection on or around it is left alone.
  const { activeNodeIds, dimmedNodeIds } = useMemo(() => {
    const active = new Set()
    const dimmed = new Set()
    edges.forEach((e) => {
      const selBySource = switchData[e.sourceHandle] ? selections[e.sourceHandle] : undefined
      const selByTarget = switchData[e.targetHandle] ? selections[e.targetHandle] : undefined
      if (selBySource == null && selByTarget == null) return // this edge is unrelated to any selection
      const isActive =
        (selBySource != null && e.targetHandle === selBySource) ||
        (selByTarget != null && e.sourceHandle === selByTarget)
      const set = isActive ? active : dimmed
      set.add(e.source)
      set.add(e.target)
    })
    return { activeNodeIds: active, dimmedNodeIds: dimmed }
  }, [edges, selections, switchData])

  // Nodes handed to ReactFlow: inject the switch info, the click callback and the
  // inactive (dimmed) flag into data.
  const displayNodes = useMemo(() => {
    // Is there a live selection? If so, derive dimmed from the selections; if not (e.g. a raw
    // load from a saved record) keep the data.dimmed stored in the node -> don't overwrite it.
    const anySelection = Object.keys(selections).length > 0
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        switchIds: switchIdsByNode[n.id],
        onHandleClick,
        // handle-label dropdown: this product's options + the lazy loader
        productOptions: optionsByProduct[n.data.product?.ID],
        onNeedOptions: ensureOptions,
        dimmed: anySelection
          ? (dimmedNodeIds.has(n.id) && !activeNodeIds.has(n.id)) // a selection cut it and it has no active edge
          : (n.data.dimmed ?? false),                            // keep the saved value
      },
    }))
  }, [nodes, switchIdsByNode, onHandleClick, dimmedNodeIds, activeNodeIds, selections, optionsByProduct, ensureOptions])

  // Edges handed to ReactFlow: the one active per the selection is crisp, the rest are dimmed
  // (faded + dashed). ALL edges on a handle with a selection (incoming or outgoing) dim except
  // the selected one.
  const styledEdges = useMemo(
    () => edges.map((e) => {
      // is this edge's source/target handle a switch, and has a selection been made?
      const selBySource = switchData[e.sourceHandle] ? selections[e.sourceHandle] : undefined
      const selByTarget = switchData[e.targetHandle] ? selections[e.targetHandle] : undefined

      // active edge: the edge between the switch handle and the selected connected_handle.
      // Direction doesn't matter -> the edge may leave or enter that handle.
      const isActive =
        (selBySource != null && e.targetHandle === selBySource) ||
        (selByTarget != null && e.sourceHandle === selByTarget)
      if (isActive) {
        return {
          ...e,
          className: 'edge-flow',
          style: { ...e.style, stroke: '#22d3ee', strokeWidth: 3, opacity: 1, strokeDasharray: '8 6' },
        }
      }

      // there is a selection on this handle (incoming or outgoing) but this edge isn't active -> dim it
      if (selBySource != null || selByTarget != null) {
        return {
          ...e,
          style: { ...e.style, opacity: 0.18, strokeDasharray: '6 4' },
        }
      }

      return e
    }),
    [edges, selections, switchData],
  )

  // Adds a new Handle to a given node after the fact (edge + label are configurable)
  const addHandleToNode = useCallback((nodeId, position = Position.Right, label = '') => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n
        const handles = n.data.handles ?? []
        // the position is now computed at render time as a percentage (symmetric around the center)
        // autoOpen: an unlabelled handle opens its select right away and is dropped again if the
        // user closes it without choosing anything (see HandleLabel)
        const newHandle = { id: `h-${uniqueId()}`, type: 'source', position, label, autoOpen: !label }
        return { ...n, data: { ...n.data, handles: [...handles, newHandle] } }
      }),
    )
    // tell React Flow "this node's handle layout changed" so the connections land correctly
    updateNodeInternals(nodeId)
  }, [setNodes, updateNodeInternals])

  // Updates a handle's label (double-click editing)
  const editHandleLabel = useCallback((nodeId, handleId, newLabel) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n
        const handles = (n.data.handles ?? []).map((h) => {
          if (h.id !== handleId) return h
          // the handle now has a label -> drop autoOpen so it never reopens and never gets saved
          const { autoOpen, ...rest } = h
          return { ...rest, label: newLabel }
        })
        return { ...n, data: { ...n.data, handles } }
      }),
    )
  }, [setNodes])

  // Deletes a handle + also clears the edges attached to it
  const removeHandle = useCallback((nodeId, handleId) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n
        const handles = (n.data.handles ?? []).filter((h) => h.id !== handleId)
        return { ...n, data: { ...n.data, handles } }
      }),
    )
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !(
            (e.source === nodeId && e.sourceHandle === handleId) ||
            (e.target === nodeId && e.targetHandle === handleId)
          ),
      ),
    )
    updateNodeInternals(nodeId)
  }, [setNodes, setEdges, updateNodeInternals])


  const removeNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
  }, [setNodes, setEdges])

  const captureImage = useCallback(async () => {
    const width = 1024
    const height = 768
    const bounds = getRectOfNodes(nodes)
    const [x, y, zoom] = getTransformForBounds(bounds, width, height, 0.5, 2, 0.1)
    const viewport = document.querySelector('.react-flow__viewport')
    if (!viewport) return null
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#ffffff',
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    })
    const blob = await (await fetch(dataUrl)).blob()
    return blob
  }, [nodes])

  // Is there a selection on any switch? (if so "Update" -> "Save scenario")
  const hasSelection = Object.keys(selections).length > 0

  // Strip the injected functions out of the node data (for saving)
  const cleanNodes = useCallback(() => (
    nodes.map((n) => {
      const { onAddHandle, onEditHandle, onRemoveHandle, onRemoveNode, ...data } = n.data
      return { ...n, data }
    })
  ), [nodes])

  // Bake the selection into the edges: write data.selected = true on the selected (active) edge.
  // This way the selection survives even though the design is saved as just nodes+edges.
  const bakeEdges = useCallback(() => (
    edges.map((e) => {
      const selBySource = switchData[e.sourceHandle] ? selections[e.sourceHandle] : undefined
      const selByTarget = switchData[e.targetHandle] ? selections[e.targetHandle] : undefined
      const selected =
        (selBySource != null && e.targetHandle === selBySource) ||
        (selByTarget != null && e.sourceHandle === selByTarget)
      return { ...e, data: { ...e.data, selected } }
    })
  ), [edges, selections, switchData])

  const handleSave = useCallback(async () => {
    const cleanedNodes = cleanNodes()
    const design = { nodes: cleanedNodes, edges: bakeEdges() }

    try {
      let res
      if (id) {
        res = await updateDesign({
          ID: id,
          design: JSON.stringify(design),
        })
      } else {
        const photo = await captureImage()
        const formData = new FormData()
        formData.append('Name', designName)
        if (photo) formData.append('Photo', photo, `${designName || 'design'}.png`)
        formData.append('design', JSON.stringify(design))
        res = await createDesign(formData)
      }

      if (res?.ID) {
        // success
        console.log('saved:', res)
        setSaveError('')
        setSaveOpen(false)
        setDesignName('')
      } else if (res?.error) {
        // the backend returned an error -> show the message inside it
        setSaveError(res.error.message ?? res.error)
      } else {
        setSaveError('An unknown error occurred')
      }
    } catch (e) {
      setSaveError(e.message || 'Save failed')
    }
  }, [cleanNodes, bakeEdges, designName, captureImage, id])

  // "Save scenario": sends the nodes+edges with the selection baked in, the id and the selected switches.
  // For selected switches: in the connections array from the API the picked connection gets active:1, the rest active:0.
  const handleSaveScenario = useCallback(async (name) => {
    // copies instead of the raw nodes/edges -> extra info (dimmed, style, className) travels with them
    const nodesToSave = displayNodes
    const edgesToSave = styledEdges

    const scenarioSwitch = {}
    for (const [handleId, entry] of Object.entries(switchData)) {
      const sel = selections[handleId]
      if (sel == null) continue // include only switches that have a selection
      scenarioSwitch[handleId] = {
        ...entry,
        connections: (entry.connections ?? []).map((c) => ({
          ...c,
          active: c.connected_handle === sel ? 1 : 0,
        })),
      }
    }

    const payload = { ID: id, Name: name, design: { nodes: nodesToSave, edges: edgesToSave }, switch: scenarioSwitch }

    setScenarioSaving(true)
    try {
      const res = await createScript(payload)
      if (res?.ID) {
        // success -> done
        console.log('scenario saved:', res)
        setScenarioError('')
        setScenarioOpen(false)
        setScenarioName('')
      } else if (res?.error) {
        setScenarioError(res.error.message ?? res.error)
      } else {
        setScenarioError('An unknown error occurred')
      }
    } catch (e) {
      setScenarioError(e.message || 'Saving the scenario failed')
    } finally {
      setScenarioSaving(false)
    }
  }, [displayNodes, styledEdges, id, switchData, selections])

  // Clear the canvas: reset the node and edge arrays
  const handleClear = useCallback(() => {
    setNodes([])
    setEdges([])
  }, [setNodes, setEdges])

  // Load saved data: wire the functions back into the node data
  const loadDesign = useCallback((record) => {
    if (!record) return
    const restoredNodes = (record.nodes ?? []).map((n) => ({
      ...n,
      data: {
        ...n.data,
        onAddHandle: addHandleToNode,
        onEditHandle: editHandleLabel,
        onRemoveHandle: removeHandle,
        onRemoveNode: removeNode,
      },
    }))
    setNodes(restoredNodes)
    setEdges(record.edges ?? [])
  }, [addHandleToNode, editHandleLabel, removeHandle, removeNode, setNodes, setEdges])

  // Load the design when the page opens: if the URL has an id, fetch it from the API (use the
  // canvas_data that comes back). Without an id we start with an empty canvas.
  useEffect(() => {
    if (!id) return
    getDesign({ id }).then((res) => {
      const item = Array.isArray(res) ? res[0] : res
      if (!item?.canvas_data) return
      setLoadedName(item.Name ?? '')
      const record = typeof item.canvas_data === 'string'
        ? JSON.parse(item.canvas_data)
        : item.canvas_data
      loadDesign(record)

      // the "switch" data arrives as a string -> parse it
      const sw = item.switch ?? item.Switch
      let parsedSwitch = {}
      if (sw) {
        try {
          parsedSwitch = (typeof sw === 'string' ? JSON.parse(sw) : sw) || {}
        } catch (e) {
          console.error('could not parse switch data:', e)
        }
      }
      setSwitchData(parsedSwitch)

      // rebuild selections from the choices baked into the edges (data.selected)
      const restored = {}
      ;(record.edges ?? []).forEach((e) => {
        if (!e.data?.selected) return
        if (parsedSwitch[e.sourceHandle]) restored[e.sourceHandle] = e.targetHandle
        else if (parsedSwitch[e.targetHandle]) restored[e.targetHandle] = e.sourceHandle
      })
      setSelections(restored)
    })
  }, [id, loadDesign])

  function handleSelectProduct(product) {
     setNodes((nds) => [
    ...nds,
    {
      id: String(uniqueId()),
      type: 'imageNode',
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      style: { width: 180, height: 180 },
      data: {
        // same product added again -> numbered label (usc, usc1, usc2...)
        label: makeUniqueLabel(product.Name, nds),
        image: `${PHOTO_BASE_URL}/${product.Photo}`,
        product:product,
        meta: {

        },
        // initial handles
        handles: [

        ],
        // functions the in-node controls will call
        onAddHandle: addHandleToNode,
        onEditHandle: editHandleLabel,
        onRemoveHandle: removeHandle,
        onRemoveNode: removeNode,
      },
    },
  ])

  }

    return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* selected (active) edge animation: dashes flowing as if current runs through it + a soft glow */}
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
        nodes={displayNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeDoubleClick={onEdgeDoubleClick}
        edgesUpdatable={true}
        defaultEdgeOptions={{
          style: { stroke: '#334155', strokeWidth: 2.5 },
        }}
        minZoom={0.2}
        maxZoom={4}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      <div style={{ position: 'fixed', right: 24, top: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* serial port connection status */}
          <div
            title={serialConnected
              ? `Connected: ${serialStatus.port} · ${serialStatus.baudrate} baud`
              : 'Not connected to a serial port'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 14px', height: 42, borderRadius: 10,
              background: '#fff', border: '1px solid #e2e8f0',
              fontSize: 13, color: '#1e293b',
              boxShadow: '0 8px 20px -8px rgba(15,23,42,0.35)',
            }}
          >
            <span
              style={{
                width: 9, height: 9, borderRadius: '50%',
                background: serialConnected ? '#22c55e' : '#ef4444',
                boxShadow: serialConnected ? '0 0 0 3px rgba(34,197,94,0.18)' : '0 0 0 3px rgba(239,68,68,0.15)',
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {serialConnected ? serialStatus.port : 'Not connected'}
            </span>
          </div>
          <button
            onClick={handleClear}
            title="Clear the canvas"
            aria-label="Clear"
            style={{
              width: 42, height: 42, borderRadius: 10,
              background: '#fff', color: '#dc2626', border: '1px solid #fecaca',
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px -8px rgba(15,23,42,0.35)',
            }}
          >
            🧹
          </button>
          <button
            onClick={() => {
              setSaveError('')
              if (hasSelection) { setScenarioName(''); setScenarioError(''); setScenarioOpen(true) }   // with a selection: ask for a scenario name
              else if (id) setUpdateConfirmOpen(true)  // updating: confirm first (card connections will change)
              else setSaveOpen(true)                   // on a fresh save, open the name modal
            }}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: hasSelection ? '#7c3aed' : '#16a34a', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: hasSelection ? '0 8px 20px -6px rgba(124,58,237,0.5)' : '0 8px 20px -6px rgba(22,163,74,0.5)',
            }}
          >
            {hasSelection ? 'Save scenario' : (id ? 'Update' : 'Save')}
          </button>
        </div>

        {id && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 10,
              background: '#fff', border: '1px solid #e2e8f0',
              fontSize: 14, color: '#1e293b',
              boxShadow: '0 8px 20px -8px rgba(15,23,42,0.35)',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Editing:</span>
            <span style={{ fontWeight: 600 }}>{loadedName || '—'}</span>
          </div>
        )}
      </div>

      {updateConfirmOpen && (
        <div
          onClick={() => setUpdateConfirmOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380, background: '#fff', borderRadius: 14, padding: 20,
              boxShadow: '0 24px 60px -16px rgba(15,23,42,0.5)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
              Güncellemeyi onayla
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
              Güncelleme işlemi sonrasında kart bağlantılarınız değişecektir.
              Bu değişiklikleri yapmak istediğinizden emin misiniz?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUpdateConfirmOpen(false)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                onClick={() => { setUpdateConfirmOpen(false); handleSave() }}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#7c3aed', color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Evet, güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {saveOpen && (
        <div
          onClick={() => setSaveOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 320, background: '#fff', borderRadius: 14, padding: 20,
              boxShadow: '0 24px 60px -16px rgba(15,23,42,0.5)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
              Save design
            </div>
            <input
              autoFocus
              value={designName}
              onChange={(e) => { setDesignName(e.target.value); setSaveError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && designName.trim()) handleSave() }}
              placeholder="Design name"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: saveError ? 8 : 16,
              }}
            />
            {saveError && (
              <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSaveOpen(false)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!designName.trim()}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: designName.trim() ? '#16a34a' : '#94a3b8', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  cursor: designName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {scenarioOpen && (
        <div
          onClick={() => setScenarioOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 320, background: '#fff', borderRadius: 14, padding: 20,
              boxShadow: '0 24px 60px -16px rgba(15,23,42,0.5)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
              Save scenario
            </div>
            <input
              autoFocus
              value={scenarioName}
              onChange={(e) => { setScenarioName(e.target.value); setScenarioError('') }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && scenarioName.trim() && !scenarioSaving) {
                  handleSaveScenario(scenarioName.trim())
                }
              }}
              placeholder="Scenario name"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: scenarioError ? 8 : 16,
              }}
            />
            {scenarioError && (
              <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {scenarioError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setScenarioOpen(false)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveScenario(scenarioName.trim())}
                disabled={!scenarioName.trim() || scenarioSaving}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: (scenarioName.trim() && !scenarioSaving) ? '#7c3aed' : '#94a3b8', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  cursor: (scenarioName.trim() && !scenarioSaving) ? 'pointer' : 'not-allowed',
                }}
              >
                {scenarioSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {switchSelect && switchData[switchSelect.handleId] && (
        <>
          {/* click outside to close */}
          <div
            onClick={() => setSwitchSelect(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 2500 }}
          />
          <div
            style={{
              position: 'fixed',
              left: Math.min(switchSelect.x, window.innerWidth - 300),
              top: Math.min(switchSelect.y, window.innerHeight - 260),
              zIndex: 2600,
              width: 280, maxHeight: 320, overflowY: 'auto',
              background: '#fff', borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 16px 40px -12px rgba(15,23,42,0.4)',
              padding: 8,
            }}
          >
            <div style={{ padding: '6px 10px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
              Select the active connection
            </div>

            {/* empty option: clear the selection (none is active) */}
            {(() => {
              const noneSelected = selections[switchSelect.handleId] == null
              return (
                <button
                  onClick={() => clearSelection(switchSelect.handleId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', textAlign: 'left',
                    padding: '8px 10px', marginBottom: 2,
                    border: noneSelected ? '1px solid #2563eb' : '1px solid transparent',
                    background: noneSelected ? '#eff6ff' : 'transparent',
                    borderRadius: 9, cursor: 'pointer', fontSize: 13.5,
                  }}
                  onMouseEnter={(e) => { if (!noneSelected) e.currentTarget.style.background = '#f1f5f9' }}
                  onMouseLeave={(e) => { if (!noneSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: 16, color: '#2563eb', fontWeight: 700 }}>{noneSelected ? '✓' : ''}</span>
                  <span style={{ flex: 1, fontStyle: 'italic', color: '#94a3b8' }}>— (empty / no selection)</span>
                </button>
              )
            })()}

            {switchData[switchSelect.handleId].connections?.map((conn) => {
              const isActive = selections[switchSelect.handleId] === conn.connected_handle
              return (
                <button
                  key={conn.connected_handle}
                  onClick={() => selectConnection(switchSelect.handleId, conn.connected_handle)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', textAlign: 'left',
                    padding: '8px 10px', marginBottom: 2,
                    border: isActive ? '1px solid #2563eb' : '1px solid transparent',
                    background: isActive ? '#eff6ff' : 'transparent',
                    borderRadius: 9, cursor: 'pointer',
                    fontSize: 13.5, color: '#1e293b',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: 16, color: '#2563eb', fontWeight: 700 }}>{isActive ? '✓' : ''}</span>
                  <span style={{ flex: 1 }}>{resolveConnLabel(conn)}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {open && (
        <div
          style={{
            position: 'fixed', right: 24, bottom: 92, zIndex: 1000,
            width: 280, maxHeight: 380, overflowY: 'auto',
            background: '#fff', borderRadius: 14,
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 40px -12px rgba(15,23,42,0.4)',
            padding: 8,
          }}
        >
          <div style={{ padding: '8px 10px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
            Products
          </div>

          {products.length === 0 && (
            <div style={{ padding: '8px 10px', fontSize: 13, color: '#94a3b8' }}>No products found</div>
          )}

          {products.map((product) => (
            <button
              key={product.ID}
              onClick={() => handleSelectProduct(product)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left',
                padding: '8px 10px', marginBottom: 2,
                border: 'none', background: 'transparent',
                borderRadius: 9, cursor: 'pointer',
                fontSize: 13.5, color: '#1e293b',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.Photo && (
                  <img src={`${PHOTO_BASE_URL}/${product.Photo}`} alt={product.Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </span>
              <span style={{ fontWeight: 500 }}>{product.Name}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Add product"
        style={{
          position: 'fixed', right: 24, bottom: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: '#2563eb', color: '#fff', border: 'none',
          fontSize: 28, lineHeight: 1, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 24px -6px rgba(37,99,235,0.6)',
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s ease',
        }}
      >
        +
      </button>
    </div>

  )
}

function Design() {
  return (
    <ReactFlowProvider>
      <DesignInner />
    </ReactFlowProvider>
  )
}

export default Design
