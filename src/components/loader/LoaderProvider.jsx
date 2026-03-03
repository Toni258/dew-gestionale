// src/components/loader/LoaderProvider.jsx
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { registerLoader } from '../../services/loader';

const LoaderContext = createContext(null);

const SHOW_DELAY_MS = 1000;

export default function LoaderProvider({ children }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('Caricamento…');
    const [mode, setMode] = useState('nonBlocking'); // 'nonBlocking' | 'blocking'

    const delayTimerRef = useRef(null);
    const activeCountRef = useRef(0);
    const blockingCountRef = useRef(0);

    function clearDelayTimer() {
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
        }
    }

    function scheduleShow() {
        // evita flicker: compare solo dopo 1s se ancora attivo
        clearDelayTimer();
        delayTimerRef.current = setTimeout(() => {
            if (activeCountRef.current > 0) setVisible(true);
        }, SHOW_DELAY_MS);
    }

    function start({ message: nextMessage, mode: nextMode } = {}) {
        activeCountRef.current += 1;

        if (nextMessage) setMessage(nextMessage);

        if (nextMode === 'blocking') {
            blockingCountRef.current += 1;
            setMode('blocking');
        } else if (blockingCountRef.current === 0) {
            setMode('nonBlocking');
        }

        // se già visibile, non serve ritardare
        if (visible) return;

        scheduleShow();
    }

    function stop() {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);

        // se si “chiude” una blocking, scala il contatore
        if (blockingCountRef.current > 0) {
            blockingCountRef.current = Math.max(
                0,
                blockingCountRef.current - 1,
            );
        }

        // se ci sono ancora operazioni attive, resta visibile
        if (activeCountRef.current > 0) {
            // se non ci sono più blocking attive, torna nonBlocking
            if (blockingCountRef.current === 0) setMode('nonBlocking');
            return;
        }

        // nessuna operazione attiva
        clearDelayTimer();
        setVisible(false);
        setMode('nonBlocking');
    }

    const api = useMemo(() => ({ start, stop }), [visible]);

    useEffect(() => {
        registerLoader(api);
        return () => {
            registerLoader(null);
            clearDelayTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <LoaderContext.Provider value={api}>
            {children}

            {visible && mode === 'blocking' && (
                <div className="loader-overlay">
                    <div className="loader-card">
                        <div className="loader-spinner" />
                        <div className="loader-text">{message}</div>
                    </div>
                </div>
            )}

            {visible && mode === 'nonBlocking' && (
                <div className="loader-inline">
                    <div className="loader-inline__spinner" />
                    <div className="loader-inline__text">{message}</div>
                </div>
            )}
        </LoaderContext.Provider>
    );
}
