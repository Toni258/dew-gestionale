import { loader } from './loader';

/**
 * Esegue una funzione async mostrando il loader.
 * - message: testo mostrato nel loader
 * - fn: funzione async da eseguire
 * - mode: 'nonBlocking' | 'blocking' (default: nonBlocking)
 *
 * Ritorna il risultato di fn (oppure lancia l'errore come farebbe fn).
 */
export async function withLoader(message, fn, mode = 'nonBlocking') {
    loader.start(message, mode);

    try {
        return await fn();
    } finally {
        loader.stop();
    }
}
