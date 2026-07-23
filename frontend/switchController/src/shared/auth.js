// Basit admin oturumu — JWT yok.
// Token backend'den alınır ve sessionStorage'da tutulur (sekme kapanınca gider
// = otomatik çıkış). isAdmin modül yüklenirken bir kez okunur; login/logout
// sonrası sayfa yenilenir (window.location.reload) -> "isAdmin" kullanan her
// yer güncel değeri alır. Reaktif bir store kurmaya gerek kalmaz.

const TOKEN_KEY = 'admin_token'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

// Token varsa admin. (Sunucu token'ı iptal etmişse ilk yazma isteğinde 401 gelir.)
export const isAdmin = !!getToken()
