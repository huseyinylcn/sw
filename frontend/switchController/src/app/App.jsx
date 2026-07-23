import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDesigns, deleteDesign,getScripts,getScript,updateScript,getSerial } from '../services/DesignService'
import { isAdmin } from '../shared/auth'

const PHOTO_BASE_URL = 'http://192.168.150.220:5001/uploads'
const NAV_SPACE = 132 // room for the fixed navbar on the left (18 + 96 + 18)

function App() {
  const [designs, setDesigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [scripts, setScripts] = useState([])          // scenarios listed on the right
  const [scriptsDesign, setScriptsDesign] = useState(null) // design whose scenarios are listed
  const [scriptsLoading, setScriptsLoading] = useState(false)
  const [activeScriptId, setActiveScriptId] = useState(null) // PortSettings.switch_ID -> active scenario
  const [activating, setActivating] = useState(null)         // ID of the scenario being activated
  const [deleteTarget, setDeleteTarget] = useState(null)     // design pending delete confirmation
  const [deleting, setDeleting] = useState(false)            // delete request in flight
  const navigate = useNavigate()

  useEffect(() => {
    getDesigns().then(setDesigns)
  }, [])

  // Learn which scenario is active from switch_ID in the serial port settings
  useEffect(() => {
    getSerial()
      .then((res) => {
        const row = Array.isArray(res) ? res[0] : res
        setActiveScriptId(row?.switch_ID ?? null)
      })
      .catch(() => setActiveScriptId(null))
  }, [])

  // Load a design's scenarios and list them on the right. Shared by the card click,
  // the "Scenarios" button and the auto-open on first load.
  const loadScripts = useCallback(async (design) => {
    setSelected(design)
    setScriptsDesign(design)
    setScriptsLoading(true)
    try {
      const res = await getScripts({ id: design.ID })
      setScripts(Array.isArray(res) ? res : [])
    } catch (err) {
      setScripts([])
    } finally {
      setScriptsLoading(false)
    }
  }, [])

  const handleShowScripts = (design, e) => {
    e.stopPropagation()
    loadScripts(design)
  }

  // On first load: if there are designs, open the first one's scenarios automatically.
  useEffect(() => {
    if (designs.length > 0 && !scriptsDesign) loadScripts(designs[0])
  }, [designs, scriptsDesign, loadScripts])

  // Activate: the scenario's ID is sent as switch_ID -> the serial port uses that scenario.
  const handleActivate = async (script, e) => {
    e.stopPropagation()
    setActivating(script.ID)
    try {
      await updateScript({ switch_ID: script.ID })
      setActiveScriptId(script.ID)
    } catch (err) {
      console.error('could not activate scenario:', err)
    } finally {
      setActivating(null)
    }
  }

  // Edit: put the ID in the URL and navigate to the Design page. The Design page
  // fetches the data itself from the API using the id in the URL.
  const handleEdit = (design, e) => {
    e.stopPropagation()
    navigate(`/design/${design.ID}`)
  }

  // Switch board: open the card layout for this design -> /board/<design id>
  const handleShowBoard = (design, e) => {
    e.stopPropagation()
    navigate(`/board/${design.ID}`)
  }

  // Delete button -> open the confirmation modal (actual delete happens on confirm)
  const handleDelete = (design, e) => {
    e.stopPropagation()
    setDeleteTarget(design)
  }

  // Confirmed delete: only ID (and Name) are sent; on success the design drops out of the list.
  const confirmDelete = async () => {
    const design = deleteTarget
    if (!design) return
    setDeleting(true)
    try {
      await deleteDesign({ ID: design.ID, Name: design.Name })
      setDesigns((prev) => prev.filter((d) => d.ID !== design.ID))
      setSelected((prev) => (prev?.ID === design.ID ? null : prev))
      setDeleteTarget(null)
    } catch (err) {
      console.error('could not delete design:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex', height: '100vh', width: '100vw',
        paddingLeft: NAV_SPACE, boxSizing: 'border-box',
        background: '#f1f5f9', fontFamily: 'var(--sans)',
      }}
    >
      {/* LEFT HALF: design cards */}
      <div style={{ width: '50%', height: '100%', overflowY: 'auto', padding: '28px 24px', boxSizing: 'border-box' }}>
 

        {designs.length === 0 && (
          <div style={{ fontSize: 14, color: '#94a3b8' }}>No designs yet</div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 18,
          }}
        >
          {designs.map((design) => {
            const active = selected?.ID === design.ID
            return (
              <div
                key={design.ID}
                onClick={() => loadScripts(design)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: '#fff', borderRadius: 16, overflow: 'hidden',
                  cursor: 'pointer',
                  border: active ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: active
                    ? '0 12px 28px -12px rgba(37,99,235,0.45)'
                    : '0 6px 18px -12px rgba(15,23,42,0.35)',
                  transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
              >
                {/* top: image */}
                <div style={{ width: '100%', aspectRatio: '16 / 10', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {design.image ? (
                    <img
                      src={`${PHOTO_BASE_URL}/${design.image}`}
                      alt={design.Name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: 13 }}>No image</span>
                  )}
                </div>

                {/* bottom: name + buttons */}
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {design.Name}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleEdit(design, e)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 9,
                        border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        marginBottom: 8,
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={(e) => handleShowBoard(design, e)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 9,
                      border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      marginBottom: 8,
                    }}
                  >
                    Show Card Connections
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => handleShowScripts(design, e)}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none',
                        background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Scenarios
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(design, e)}
                        style={{
                          padding: '8px 14px', borderRadius: 9,
                          border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Yeni tasarım ekleme kartı: normalde silik, üstüne gelince canlanır.
              Design sayfası admin korumalı olduğu için sadece admin'e gösterilir. */}
          {isAdmin && (
            <div
              onClick={() => navigate('/design')}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                minHeight: 240, height: '100%', boxSizing: 'border-box', padding: 20,
                background: 'transparent', borderRadius: 16,
                border: '2px dashed #cbd5e1', color: '#94a3b8',
                cursor: 'pointer', opacity: 0.55,
                transition: 'opacity 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.color = '#2563eb'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.55'
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Design Add</div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT HALF: scenarios of the selected design */}
      <div
        style={{
          width: '50%', height: '100%', overflowY: 'auto',
          borderLeft: '1px solid #e2e8f0', background: '#f8fafc',
          padding: '28px 24px', boxSizing: 'border-box',
        }}
      >
        {!scriptsDesign ? (
          <div style={{ color: '#cbd5e1', fontSize: 14, display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            Click a design's "Scenarios" button to see its scenarios
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
              {scriptsDesign.Name} — Scenarios
            </div>

            {scriptsLoading ? (
              <div style={{ fontSize: 14, color: '#94a3b8' }}>Loading…</div>
            ) : scripts.length === 0 ? (
              <div style={{ fontSize: 14, color: '#94a3b8' }}>No scenarios for this design</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scripts.map((script) => {
                  const isActive = activeScriptId === script.ID
                  const isBusy = activating === script.ID
                  return (
                    <div
                      key={script.ID}
                      onClick={() => navigate(`/scenario/${script.ID}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        background: '#fff', borderRadius: 12, padding: '14px 16px',
                        border: isActive ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        boxShadow: '0 6px 18px -12px rgba(15,23,42,0.35)',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {script.Name}
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>#{script.ID}</span>
                      </div>

                      <button
                        onClick={(e) => handleActivate(script, e)}
                        disabled={isActive || isBusy}
                        style={{
                          flexShrink: 0, padding: '7px 14px', borderRadius: 9,
                          border: isActive ? '1px solid #bbf7d0' : 'none',
                          background: isActive ? '#f0fdf4' : (isBusy ? '#94a3b8' : '#16a34a'),
                          color: isActive ? '#16a34a' : '#fff',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          cursor: (isActive || isBusy) ? 'default' : 'pointer',
                        }}
                      >
                        {isActive ? '✓ Active' : (isBusy ? 'Sending…' : 'Activate')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <div
          onClick={() => { if (!deleting) setDeleteTarget(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
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
              Confirm deletion
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
              <b>{deleteTarget.Name}</b> Are you sure you want to delete your design?
This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14,
                  cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
               Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: deleting ? '#94a3b8' : '#dc2626', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
