// Module used for app.
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import ForceChangePasswordModal from './components/auth/ForceChangePasswordModal';

// Helper function used by app.
function App() {
    return (
        <AuthProvider>
            <AppRouter />
            <ForceChangePasswordModal />
        </AuthProvider>
    );
}

export default App;