import { useState, useEffect, useCallback } from 'react'
import {
  getSerial,
  getSerialStatus,
  updateSerial,
  connectSerial,
  disconnectSerial,
} from '../services/DesignService'

const BAUD_RATES = [2400, 4800, 9600, 19200, 38400, 57600, 115200]
const STATUS_INTERVAL = 3000

function Settings() {
  const [rows, setRows] = useState([])          // getSerial result
  const [status, setStatus] = useState(null)    // getSerialStatus result
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)       // is a connect/disconnect/save in flight
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const loadSerial = useCallback(async () => {
    try {
      const res = await getSerial()
      setRows(Array.isArray(res) ? res : res ? [res] : [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load serial port settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const res = await getSerialStatus()
      setStatus(res)
    } catch {
      setStatus(null) // if the backend is unreachable, treat it as not connected
    }
  }, [])

  useEffect(() => {
    loadSerial()
  }, [loadSerial])

  // poll the status at a fixed interval
  useEffect(() => {
    loadStatus()
    const t = setInterval(loadStatus, STATUS_INTERVAL)
    return () => clearInterval(t)
  }, [loadStatus])

  const connected = status?.connected === true

  // update form fields locally (sent only when Save is clicked)
  const patchRow = (ID, patch) => {
    setRows((rs) => rs.map((r) => (r.ID === ID ? { ...r, ...patch } : r)))
    setInfo('')
  }

  const handleSave = async (row) => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await updateSerial({
        ID: row.ID,
        port: row.port,
        baund_rate: Number(row.baund_rate),
        switch_ID: row.switch_ID,
      })
      setInfo('Settings saved')
      await loadSerial()
      await loadStatus()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleConnect = async () => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await connectSerial()
      setInfo('Connection request sent')
      await loadStatus()
    } catch (e) {
      setError(e.message || 'Could not connect')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await disconnectSerial()
      setInfo('Disconnect request sent')
      await loadStatus()
    } catch (e) {
      setError(e.message || 'Could not disconnect')
    } finally {
      setBusy(false)
    }
  }

  const card = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
    padding: 20, boxShadow: '0 8px 20px -12px rgba(15,23,42,0.35)',
  }
  const label = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 6 }
  const input = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
    borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff',
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24, color: '#1e293b' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</h1>

      {/* connection status */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: connected ? '#22c55e' : '#ef4444',
                boxShadow: connected ? '0 0 0 4px rgba(34,197,94,0.18)' : '0 0 0 4px rgba(239,68,68,0.15)',
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>
                {connected ? 'Connected to serial port' : 'Not connected'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {connected
                  ? `${status.port} · ${status.baudrate} baud`
                  : 'Waiting for connection'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConnect}
              disabled={busy || connected}
              style={{
                padding: '9px 16px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 600, color: '#fff',
                background: (busy || connected) ? '#94a3b8' : '#16a34a',
                cursor: (busy || connected) ? 'not-allowed' : 'pointer',
              }}
            >
              Connect
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy || !connected}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                border: '1px solid #fecaca', background: '#fef2f2',
                color: (busy || !connected) ? '#94a3b8' : '#dc2626',
                cursor: (busy || !connected) ? 'not-allowed' : 'pointer',
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...card, marginBottom: 16, padding: '12px 16px', borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}
      {info && !error && (
        <div style={{ ...card, marginBottom: 16, padding: '12px 16px', borderColor: '#bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 13 }}>
          {info}
        </div>
      )}

      {/* serial port settings */}
      {loading && <div style={{ ...card, color: '#94a3b8', fontSize: 14 }}>Loading…</div>}

      {!loading && rows.length === 0 && (
        <div style={{ ...card, color: '#94a3b8', fontSize: 14 }}>No saved serial port settings found</div>
      )}

      {rows.map((row) => (
        <div key={row.ID} style={{ ...card, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Serial port setting</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              ID {row.ID} · Switch {row.switch_ID}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={label}>Port</div>
              <input
                value={row.port ?? ''}
                onChange={(e) => patchRow(row.ID, { port: e.target.value })}
                placeholder="COM6"
                style={input}
              />
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={label}>Baud rate</div>
              <select
                value={row.baund_rate ?? ''}
                onChange={(e) => patchRow(row.ID, { baund_rate: Number(e.target.value) })}
                style={input}
              >
                {/* if the saved rate is not in the list, show it too */}
                {!BAUD_RATES.includes(Number(row.baund_rate)) && row.baund_rate != null && (
                  <option value={row.baund_rate}>{row.baund_rate}</option>
                )}
                {BAUD_RATES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => handleSave(row)}
              disabled={busy || !String(row.port ?? '').trim()}
              style={{
                padding: '9px 18px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 600, color: '#fff',
                background: (busy || !String(row.port ?? '').trim()) ? '#94a3b8' : '#2563eb',
                cursor: (busy || !String(row.port ?? '').trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              Save
            </button>
          </div>

          {connected && status?.port && status.port !== row.port && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: '#b45309' }}>
              You are currently connected over <b>{status.port}</b>. Disconnect and reconnect
              for the change to take effect.
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Settings
