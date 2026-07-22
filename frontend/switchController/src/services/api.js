const BASE_URL = 'http://192.168.150.220:5001'

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export default request 