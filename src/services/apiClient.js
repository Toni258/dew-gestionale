async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

async function requestJson(url, { method = 'GET', body, headers } = {}) {
    const res = await fetch(url, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(headers ?? {}),
        },
        body: body ? JSON.stringify(body) : undefined,
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
    return requestJson(url, { ...(options ?? {}), method: 'GET' });
}

export function postJson(url, body, options) {
    return requestJson(url, { ...(options ?? {}), method: 'POST', body });
}

export function putJson(url, body, options) {
    return requestJson(url, { ...(options ?? {}), method: 'PUT', body });
}

export async function delJson(url, options) {
    const res = await fetch(url, { method: 'DELETE', ...(options ?? {}) });

    if (!res.ok) {
        const data = await safeJson(res);
        const message =
            data?.error ||
            data?.message ||
            `Eliminazione fallita (${res.status})`;
        throw new Error(message);
    }

    return true;
}
