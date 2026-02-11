export async function getDishById(dishId) {
    const res = await fetch(`/api/dishes/${dishId}`);
    if (!res.ok) throw new Error('Impossibile caricare il piatto');
    return res.json();
}

export async function checkDishNameExists(name, { excludeId } = {}) {
    const qs = new URLSearchParams({ name });
    if (excludeId) qs.set('excludeId', String(excludeId));

    const res = await fetch(`/api/dishes/exists?${qs.toString()}`);
    if (!res.ok) throw new Error('Impossibile verificare il nome');
    return res.json(); // { exists: boolean }
}

export async function updateDish(dishId, formData) {
    const res = await fetch(`/api/dishes/${dishId}`, {
        method: 'PUT',
        body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Errore aggiornamento piatto');
    return json;
}

export async function unsuspendDish(dishId) {
    const res = await fetch(`/api/dishes/${dishId}/unsuspend`, {
        method: 'POST',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Errore rimozione sospensione');
    return json;
}

export async function suspendDishDryRun(dishId, payload) {
    const res = await fetch(`/api/dishes/${dishId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, mode: 'dry-run' }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Errore verifica sospensione');
    return json;
}

export async function suspendDishApply(dishId, payload) {
    const res = await fetch(`/api/dishes/${dishId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, mode: 'apply' }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(json?.error || 'Errore applicazione sospensione');
    return json;
}
