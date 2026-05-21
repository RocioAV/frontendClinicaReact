const API_BASE_URL = import.meta.env.VITE_API_URL

function extractErrorMessage(payload) {
  if (!payload) return 'Error de red'
  if (typeof payload === 'string') return payload
  if (Array.isArray(payload)) {
    return payload
      .map((item) => extractErrorMessage(item))
      .filter(Boolean)
      .join(', ')
  }
  if (typeof payload === 'object') {
    return payload.message || payload.msg || payload.error || JSON.stringify(payload)
  }
  return String(payload)
}

async function request(path, options = {}) {
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
  const authToken = options.token || storedToken

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const hasJson = contentType.includes('application/json')
  const payload = hasJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = extractErrorMessage(payload)
    throw new Error(message)
  }

  return payload
}

export { API_BASE_URL, request }