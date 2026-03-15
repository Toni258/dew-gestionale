function normalizeBaseUrl(value) {
    const raw = String(value ?? '').trim();
    return raw.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(path) {
    const normalizedPath = String(path ?? '').trim();
    if (!normalizedPath) return normalizedPath;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

    const pathWithLeadingSlash = normalizedPath.startsWith('/')
        ? normalizedPath
        : `/${normalizedPath}`;

    if (!API_BASE_URL) return pathWithLeadingSlash;
    return `${API_BASE_URL}${pathWithLeadingSlash}`;
}

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

async function request(url, { method = 'GET', body, headers, credentials = 'include' } = {}) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const res = await fetch(buildApiUrl(url), {
        method,
        credentials,
        headers: {
            ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
            ...(headers ?? {}),
        },
        body: body
            ? isFormData
                ? body
                : JSON.stringify(body)
            : undefined,
    });

    const data = await safeJson(res);

    if (!res.ok) {
        const message =
            data?.error || data?.message || `Richiesta fallita (${res.status})`;

        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export function getJson(url, options) {
    return request(url, { ...(options ?? {}), method: 'GET' });
}

export function postJson(url, body, options) {
    return request(url, { ...(options ?? {}), method: 'POST', body });
}

export function putJson(url, body, options) {
    return request(url, { ...(options ?? {}), method: 'PUT', body });
}

export function postForm(url, formData, options) {
    return request(url, { ...(options ?? {}), method: 'POST', body: formData });
}

export function putForm(url, formData, options) {
    return request(url, { ...(options ?? {}), method: 'PUT', body: formData });
}

export function delJson(url, options) {
    return request(url, { ...(options ?? {}), method: 'DELETE' });
}
