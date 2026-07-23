import request from './api'
import { setToken, clearToken } from '../shared/auth'

// Şifre doğruysa backend token döner -> sessionStorage'a yaz.
// Yanlışsa backend 401 döner -> request() throw eder -> { ok:false } döndürürüz.
export async function login(username, password) {
  try {
    const res = await request('/v1/post/user/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (res?.token) {
      setToken(res.token)
      return { ok: true }
    }
    return { ok: false, error: 'Beklenmeyen yanıt' }
  } catch {
    return { ok: false, error: 'Kullanıcı adı veya şifre hatalı' }
  }
}

// Backend'e çıkışı bildir (token'ı bellekten silsin), sonra yerel token'ı temizle.
export async function logout() {
  try {
    await request('/v1/post/user/logout', { method: 'POST' })
  } catch {
    // ağ hatası olsa bile yerel oturumu kapat
  }
  clearToken()
}
