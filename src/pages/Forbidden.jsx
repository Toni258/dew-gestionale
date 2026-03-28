// Main page for forbidden access.
import { useLocation, useNavigate } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Forbidden() {
    const navigate = useNavigate();
    const location = useLocation();

    const requestedPath =
        typeof location.state?.from === 'string' && location.state.from.trim()
            ? location.state.from.trim()
            : '';

    return (
        <AppLayout title="ACCESSO NEGATO">
            <div className="w-full max-w-2xl mx-auto">
                <Card className="mt-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-semibold">
                                Accesso negato
                            </h1>

                            <p className="text-brand-text/80">
                                Il tuo utente non ha i permessi necessari per
                                accedere a questa pagina.
                            </p>

                            {requestedPath && (
                                <p className="text-sm text-brand-text/60 break-all">
                                    Pagina richiesta: <strong>{requestedPath}</strong>
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                variant="secondary"
                                className="w-full sm:w-[220px]"
                                onClick={() => navigate('/dashboard')}
                            >
                                Vai alla dashboard
                            </Button>

                            <Button
                                variant="primary"
                                className="w-full sm:w-[220px]"
                                onClick={() => navigate(-1)}
                            >
                                Torna indietro
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
