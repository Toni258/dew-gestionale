// Context used to manage idle logout.
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import IdleLogoutModal from '../components/auth/IdleLogoutModal';

const IdleLogoutContext = createContext(null);

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minuti
const WARNING_DURATION_MS = 60 * 1000; // ultimo minuto
const WARNING_START_MS = IDLE_TIMEOUT_MS - WARNING_DURATION_MS;

// Helper function used by idle logout provider.
export function IdleLogoutProvider({ children }) {
    const { isAuthenticated, loading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const warningTimeoutRef = useRef(null);
    const logoutTimeoutRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    // Main state used by the page

    const [warningOpen, setWarningOpen] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(60);

    // Clears the value used by timers.
    function clearTimers() {
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = null;
        }

        if (logoutTimeoutRef.current) {
            clearTimeout(logoutTimeoutRef.current);
            logoutTimeoutRef.current = null;
        }

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }

    // Helper function used by close warning.
    function closeWarning() {
        setWarningOpen(false);
        setSecondsLeft(60);

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }

    // Handles the logic for forced logout.
    async function handleForcedLogout() {
        clearTimers();
        closeWarning();

        try {
            await logout();
        } finally {
            navigate('/login', {
                replace: true,
                state: {
                    reason: 'idle_logout',
                    from: location.pathname,
                },
            });
        }
    }

    // Helper function used by open warning.
    function openWarning() {
        setWarningOpen(true);
        setSecondsLeft(60);

        const warningEndAt = Date.now() + WARNING_DURATION_MS;

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        countdownIntervalRef.current = setInterval(() => {
            const diffMs = warningEndAt - Date.now();
            const nextSeconds = Math.max(0, Math.ceil(diffMs / 1000));
            setSecondsLeft(nextSeconds);

            if (diffMs <= 0) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        }, 250);
    }

    // Helper function used by arm timers.
    function armTimers() {
        clearTimers();

        if (!isAuthenticated || loading) return;

        warningTimeoutRef.current = setTimeout(() => {
            openWarning();
        }, WARNING_START_MS);

        logoutTimeoutRef.current = setTimeout(() => {
            handleForcedLogout();
        }, IDLE_TIMEOUT_MS);
    }

    // Helper function used by register activity.
    function registerActivity() {
        if (!isAuthenticated || loading) return;

        closeWarning();
        armTimers();
    }
    // Load data when the component opens

    useEffect(() => {
        if (!isAuthenticated || loading) {
            clearTimers();
            closeWarning();
            return;
        }

        armTimers();

        const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

        const onActivity = () => {
            registerActivity();
        };

        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, onActivity, {
                passive: true,
            });
        });

        return () => {
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, onActivity);
            });

            clearTimers();
        };
    }, [isAuthenticated, loading]);

    useEffect(() => {
        if (!isAuthenticated || loading) return;
        registerActivity();
    }, [location.pathname]);
    // Derived data used by the UI

    const value = useMemo(() => {
        return {
            warningOpen,
            secondsLeft,
            resetIdleTimer: registerActivity,
        };
    }, [warningOpen, secondsLeft]);

    return (
        <IdleLogoutContext.Provider value={value}>
            {children}

            <IdleLogoutModal
                open={warningOpen}
                secondsLeft={secondsLeft}
                onStayLoggedIn={registerActivity}
            />
        </IdleLogoutContext.Provider>
    );
}

// Manages the state and side effects for idle logout.
export function useIdleLogout() {
    return useContext(IdleLogoutContext);
}