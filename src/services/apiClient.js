// Frontend service helpers for api client.
function normalizeBaseUrl(value) {
    const raw = String(value ?? '').trim();
    return raw.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

// Builds the data needed for api url.
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

// Helper function used by safe json.
async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

// Helper function used by request.
async function request(
    url,
    { method = 'GET', body, headers, credentials = 'include' } = {},
) {
    const isFormData =
        typeof FormData !== 'undefined' && body instanceof FormData;

    const res = await fetch(buildApiUrl(url), {
        method,
        credentials,
        headers: {
            ...(body && !isFormData
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(headers ?? {}),
        },
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
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

// Returns the data used by json.
export function getJson(url, options) {
    return request(url, { ...(options ?? {}), method: 'GET' });
}

// Helper function used by post json.
export function postJson(url, body, options) {
    return request(url, { ...(options ?? {}), method: 'POST', body });
}

// Helper function used by put json.
export function putJson(url, body, options) {
    return request(url, { ...(options ?? {}), method: 'PUT', body });
}

// Helper function used by post form.
export function postForm(url, formData, options) {
    return request(url, { ...(options ?? {}), method: 'POST', body: formData });
}

// Helper function used by put form.
export function putForm(url, formData, options) {
    return request(url, { ...(options ?? {}), method: 'PUT', body: formData });
}

// Helper function used by del json.
export function delJson(url, options) {
    return request(url, { ...(options ?? {}), method: 'DELETE' });
}

// Checks whether the request failed because the resource does not exist.
export function isNotFoundError(error) {
    return Number(error?.status) === 404;
}
