// Main page shown when the requested route does not exist.
import { useLocation } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import ResourceNotFoundState from '../components/ui/ResourceNotFoundState';

export default function NotFound() {
    const location = useLocation();

    const requestedPath = `${location.pathname || ''}${location.search || ''}`;

    return (
        <AppLayout title="PAGINA NON TROVATA">
            <ResourceNotFoundState
                title="Pagina non trovata"
                description="La pagina richiesta non esiste oppure il collegamento non è più valido."
                requestedLabel="Percorso richiesto"
                requestedValue={requestedPath}
                note="Il link potrebbe essere incompleto, errato oppure puntare a una pagina rimossa dal gestionale."
            />
        </AppLayout>
    );
}
