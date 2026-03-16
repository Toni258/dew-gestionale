// Frontend service helpers for with loader notify.
import { loader } from './loader';
import { notify } from './notify';

// Helper completo: loader + notify.
//
// params:
// - message: testo loader
// - fn: funzione async
// - mode: 'nonBlocking' | 'blocking'
// - success: messaggio success (opzionale)
// - errorTitle: titolo modal error (opzionale)
// - errorMessage: fallback error (opzionale)
//
// return:
// { ok: true, data }
// { ok: false, error }
export async function withLoaderNotify({
    message = 'Caricamento…',
    fn,
    mode = 'nonBlocking',
    success,
    errorTitle,
    errorMessage,
}) {
    loader.start(message, mode);

    try {
        const data = await fn();
        if (success) notify.success(success);
        return { ok: true, data };
    } catch (e) {
        notify.error(
            e?.message || errorMessage || 'Operazione non riuscita',
            errorTitle,
        );
        return { ok: false, error: e };
    } finally {
        loader.stop();
    }
}