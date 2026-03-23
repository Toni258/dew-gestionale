// Module used for main.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './App.css';
import './styles/components.css';
import './styles/notify.css';
import './styles/loader.css';

import NotifyProvider from './components/notify/NotifyProvider.jsx';
import LoaderProvider from './components/loader/LoaderProvider.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LoaderProvider>
            <NotifyProvider>
                <App />
            </NotifyProvider>
        </LoaderProvider>
    </StrictMode>,
);
