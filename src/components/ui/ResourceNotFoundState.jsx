// Reusable state shown when a requested resource does not exist.
import { useNavigate } from 'react-router-dom';

import AlertBox from './AlertBox';
import Button from './Button';
import Card from './Card';

export default function ResourceNotFoundState({
    title = 'Risorsa non trovata',
    description =
        'La risorsa richiesta non esiste più oppure il collegamento non è valido.',
    requestedLabel = 'Risorsa richiesta',
    requestedValue = '',
    note =
        'Controlla il link oppure torna alla sezione precedente per continuare a lavorare.',
    primaryLabel = 'Torna indietro',
    onPrimaryClick,
    secondaryLabel = 'Vai alla dashboard',
    onSecondaryClick,
}) {
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card className="mt-6">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <img
                                src="/icons/warning giallo.png"
                                alt="Risorsa non trovata"
                                className="h-10 w-10 select-none"
                            />

                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold uppercase tracking-wide text-brand-warning">
                                    Avviso
                                </span>

                                <h1 className="text-3xl font-semibold">
                                    {title}
                                </h1>
                            </div>
                        </div>

                        <p className="text-brand-text/80">{description}</p>

                        {requestedValue ? (
                            <p className="text-sm text-brand-text/60 break-all">
                                {requestedLabel}: <strong>{requestedValue}</strong>
                            </p>
                        ) : null}
                    </div>

                    <AlertBox variant="warning" title="Cosa può essere successo">
                        {note}
                    </AlertBox>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-[220px]"
                            onClick={
                                onSecondaryClick ?? (() => navigate('/dashboard'))
                            }
                        >
                            {secondaryLabel}
                        </Button>

                        <Button
                            variant="primary"
                            className="w-full sm:w-[220px]"
                            onClick={onPrimaryClick ?? (() => navigate(-1))}
                        >
                            {primaryLabel}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
