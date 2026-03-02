// src/components/notify/NotifyProvider.jsx
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { registerNotify } from '../../services/notify';
import Button from '../ui/Button';

const NotifyContext = createContext(null);

const TOAST_DURATION = 4000;
const TOAST_EXIT_MS = 180;

const TOAST_PRESETS = {
    success: {
        title: 'Operazione completata',
        dotClass: 'notify-dot-success',
        barClass: 'notify-progress__bar--success',
    },
    info: {
        title: 'Informazione',
        dotClass: 'notify-dot-info',
        barClass: 'notify-progress__bar--info',
    },
    warning: {
        title: 'Attenzione',
        dotClass: 'notify-dot-warning',
        barClass: 'notify-progress__bar--warning',
    },
};

export default function NotifyProvider({ children }) {
    // toast: { id, variant, title, message }
    const [toast, setToast] = useState(null);
    const [toastClosing, setToastClosing] = useState(false);

    // modal error: { title, message }
    const [modal, setModal] = useState(null);

    const timersRef = useRef({ toast: null, toastExit: null });
    const toastIdRef = useRef(null);
    const toastClosingRef = useRef(false);

    useEffect(() => {
        toastIdRef.current = toast?.id ?? null;
    }, [toast]);

    useEffect(() => {
        toastClosingRef.current = toastClosing;
    }, [toastClosing]);

    function clearToastTimers() {
        if (timersRef.current.toast) {
            clearTimeout(timersRef.current.toast);
            timersRef.current.toast = null;
        }
        if (timersRef.current.toastExit) {
            clearTimeout(timersRef.current.toastExit);
            timersRef.current.toastExit = null;
        }
    }

    function closeToastById(id) {
        if (!id || toastIdRef.current !== id) return;
        if (toastClosingRef.current) return;

        setToastClosing(true);
        clearToastTimers();

        timersRef.current.toastExit = setTimeout(() => {
            if (toastIdRef.current === id) {
                setToast(null);
                setToastClosing(false);
            }
        }, TOAST_EXIT_MS);
    }

    function showToast(variant, { title, message }) {
        clearToastTimers();

        const id = Date.now();
        const preset = TOAST_PRESETS[variant] || TOAST_PRESETS.info;

        setToastClosing(false);
        setToast({
            id,
            variant,
            title: title || preset.title,
            message,
        });

        timersRef.current.toast = setTimeout(() => {
            closeToastById(id);
        }, TOAST_DURATION);
    }

    function showSuccess(payload) {
        showToast('success', payload);
    }

    function showInfo(payload) {
        showToast('info', payload);
    }

    function showWarning(payload) {
        showToast('warning', payload);
    }

    function showError({ title, message }) {
        clearToastTimers();
        setToast(null);
        setToastClosing(false);
        setModal({
            title: title || 'Si è verificato un errore',
            message,
        });
    }

    function closeModal() {
        setModal(null);
    }

    const api = useMemo(
        () => ({
            success: showSuccess,
            info: showInfo,
            warning: showWarning,
            error: showError,
        }),
        [],
    );

    useEffect(() => {
        registerNotify(api);
        return () => {
            registerNotify(null);
            clearToastTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toastPreset = toast ? TOAST_PRESETS[toast.variant] : null;

    return (
        <NotifyContext.Provider value={api}>
            {children}

            {/* TOAST (success/info/warning) */}
            {toast && (
                <div className="fixed top-6 right-6 z-[9999] w-[360px]">
                    <div
                        className={`notify-toast ${
                            toastClosing
                                ? 'notify-toast--exit'
                                : 'notify-toast--enter'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`notify-dot ${
                                    toastPreset?.dotClass || 'notify-dot-info'
                                }`}
                            />
                            <div className="flex flex-col">
                                <div className="text-sm font-semibold text-brand-text">
                                    {toast.title}
                                </div>
                                <div className="text-sm text-brand-text/80">
                                    {toast.message}
                                </div>
                            </div>
                        </div>

                        <div className="notify-progress">
                            <div
                                key={toast.id}
                                className={`notify-progress__bar ${
                                    toastPreset?.barClass ||
                                    'notify-progress__bar--info'
                                }`}
                                style={{
                                    animationDuration: `${TOAST_DURATION}ms`,
                                }}
                                onAnimationEnd={() => closeToastById(toast.id)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ERROR */}
            {modal && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center">
                    <div className="notify-overlay" />
                    <div className="notify-modal">
                        <div className="flex items-start gap-3">
                            <div className="notify-dot notify-dot-error" />
                            <div className="flex flex-col gap-2">
                                <div className="text-base font-semibold text-brand-text">
                                    {modal.title}
                                </div>
                                <div className="text-sm text-brand-text/80">
                                    {modal.message}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                type="button"
                                variant="danger"
                                className="rounded-lg w-[140px]"
                                onClick={closeModal}
                            >
                                Chiudi
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </NotifyContext.Provider>
    );
}
