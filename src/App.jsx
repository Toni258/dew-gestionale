import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import ForceChangePasswordModal from './components/auth/ForceChangePasswordModal';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
            <ForceChangePasswordModal />
        </AuthProvider>
    );
}

export default App;
