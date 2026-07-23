import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import logo from '../../public/icon.png'

// Ayrı tam ekran giriş sayfası. Başarılı olunca /main'e tam yükleme (reload)
// ile gidilir ki isAdmin'e bağlı her yer admin görünümüne geçsin.
export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!username.trim() || !password || busy) return
    setBusy(true)
    setError('')
    const res = await login(username.trim(), password)
    if (res.ok) {
      window.location.href = '/main'
    } else {
      setError(res.error)
      setBusy(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 15, marginBottom: 12,
    outline: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        backgroundImage: 'url(/bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'var(--sans)',
      }}
    >
      <div
        style={{
          width: 380, maxWidth: '100%',
          background: '#fff', borderRadius: 18, padding: 32,
          boxShadow: '0 40px 90px -15px rgba(0,0,0,0.55), 0 15px 35px -10px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
          <img
            src={logo}
            alt="Logo"
            style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 30, fontWeight: 800, letterSpacing: '0.14em',fontFamily:"sans-serif",
              color: '#0f172a',
            }}
          >
            MEPSAN
          </span>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 ,textAlign:"center"}}>
         Admin Login
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 ,textAlign:"center" }}>
         Log in to access the admin panel.
        </div>

        <input
          autoFocus
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Kullanıcı adı"
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Şifre"
          style={{ ...inputStyle, marginBottom: error ? 10 : 20 }}
        />

        {error && (
          <div style={{ color: '#dc2626', fontSize: 13.5, marginBottom: 20 }}>{error}</div>
        )}

        <button
          onClick={submit}
          disabled={!username.trim() || !password || busy}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none',
            background: (username.trim() && password && !busy) ? '#2563eb' : '#94a3b8',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: (username.trim() && password && !busy) ? 'pointer' : 'not-allowed',
            marginBottom: 12,
          }}
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <button
          onClick={() => navigate('/main')}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          Back to
        </button>
      </div>
    </div>
  )
}
