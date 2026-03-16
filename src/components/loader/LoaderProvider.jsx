// Provider component used to manage loader.
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

    // Clears the loader delay timer.
    function clearDelayTimer() {
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
        }
    }

    // Schedules the loader to become visible after the delay.
    function scheduleShow() {
        // Avoids flicker by showing the loader only after 1 second if it is still active.
        clearDelayTimer();
        delayTimerRef.current = setTimeout(() => {
            if (activeCountRef.current > 0) setVisible(true);
        }, SHOW_DELAY_MS);
    }

    // Starts the current flow.
    function start({ message: nextMessage, mode: nextMode } = {}) {
        activeCountRef.current += 1;

        if (nextMessage) setMessage(nextMessage);

        if (nextMode === 'blocking') {
            blockingCountRef.current += 1;
            setMode('blocking');
        } else if (blockingCountRef.current === 0) {
            setMode('nonBlocking');
        }

        // If the loader is already visible, no extra delay is needed.
        if (visible) return;

        scheduleShow();
    }

    // Stops the current flow.
    function stop() {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);

        // If a blocking request ends, decrease its counter.
        if (blockingCountRef.current > 0) {
            blockingCountRef.current = Math.max(
                0,
                blockingCountRef.current - 1,
            );
        }

        // If there are still active operations, keep the loader visible.
        if (activeCountRef.current > 0) {
            // If there are no blocking operations left, switch back to nonBlocking mode.
            if (blockingCountRef.current === 0) setMode('nonBlocking');
            return;
        }

        // No active operation left.
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