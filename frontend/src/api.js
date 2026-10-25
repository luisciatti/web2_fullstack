const AUTH_KEY = 'web2_min_auth'
let refreshPromise = null

export function readAuth() {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { accessToken: '', refreshToken: '' }
    try {
        return JSON.parse(raw)
    } catch {
        return { accessToken: '', refreshToken: '' }
    }
}

export function saveAuth(data) {
    const next = { accessToken: data?.accessToken || '', refreshToken: data?.refreshToken || '' }
    localStorage.setItem(AUTH_KEY, JSON.stringify(next))
    return next
}

export function clearAuth() {
    localStorage.removeItem(AUTH_KEY)
}

async function refreshOnce() {
    if (refreshPromise) return refreshPromise
    const auth = readAuth()
    if (!auth.refreshToken) return null

    refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
    })
        .then(async (response) => {
            if (!response.ok) return null
            const data = await response.json().catch(() => null)
            if (!data?.accessToken) return null
            saveAuth(data)
            return data
        })
        .finally(() => {
            refreshPromise = null
        })

    return refreshPromise
}

export async function apiFetch(path, options = {}) {
    const { method = 'GET', body, headers = {}, auth = true } = options
    const url = path.startsWith('/') ? path : `/${path}`
    const authData = readAuth()
    const requestHeaders = { ...headers }
    let payloadBody = body

    if (auth && authData.accessToken) {
        requestHeaders.Authorization = `Bearer ${authData.accessToken}`
    }

    if (payloadBody && !(payloadBody instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json'
        payloadBody = JSON.stringify(payloadBody)
    }

    let response

    try {
        response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: payloadBody,
        })
    } catch {
        throw new Error('Não consegui falar com o servidor')
    }

    if ((response.status === 401 || response.status === 403) && auth) {
        const refreshed = await refreshOnce()
        if (!refreshed) {
            clearAuth()
            throw new Error('Sessão expirada. Entre novamente.')
        }

        const next = readAuth()
        const retryHeaders = { ...requestHeaders, Authorization: `Bearer ${next.accessToken}` }
        const retryBody = payloadBody && typeof payloadBody !== 'string' ? payloadBody : payloadBody

        try {
            response = await fetch(url, {
                method,
                headers: retryHeaders,
                body: retryBody,
            })
        } catch {
            clearAuth()
            throw new Error('Não consegui falar com o servidor')
        }
    }

    if (response.status === 204) return null

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '')

    if (!response.ok) {
        if (response.status === 403 && (!payload || payload === '')) {
            throw new Error('Sem permissão para esta ação.')
        }
        if (response.status === 401) {
            clearAuth()
            throw new Error('Sessão expirada. Entre novamente.')
        }
        if (response.status === 429) {
            throw new Error('Muitas tentativas. Aguarde alguns instantes e tente novamente.')
        }
        if ([500, 502, 503, 504].includes(response.status) || !payload || payload === '') {
            throw new Error('Não consegui falar com o servidor')
        }
        if (payload?.erro) throw new Error(payload.erro)
        if (payload?.message) throw new Error(payload.message)
        if (payload && typeof payload === 'object') {
            const entries = Object.entries(payload)
            if (entries.length) {
                const text = entries
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
                    .join('; ')
                throw new Error(text)
            }
        }
        throw new Error('Falha ao consultar a API.')
    }

    return payload
}

export async function authRequest(path, body) {
    return apiFetch(path, { method: 'POST', body, auth: false })
}
