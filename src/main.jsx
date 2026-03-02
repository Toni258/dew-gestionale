import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './App.css';
import './styles/components.css';
import './styles/notify.css';

import NotifyProvider from './components/notify/NotifyProvider.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <NotifyProvider>
            <App />
        </NotifyProvider>
    </StrictMode>,
);
