import { useState } from 'react';

import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AlertBox from '../../components/ui/AlertBox';
import Form, { useFormContext } from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';

import { requestPasswordReset } from '../../services/authApi';
import { withLoaderNotify } from '../../services/withLoaderNotify';

function SubmitButton({ requestLocked }) {
    const form = useFormContext();
    const email = String(form?.values?.email ?? '').trim();

    return (
        <Button
            type="submit"
            variant="primary"
            size="md"
            className="rounded-[8px]"
            disabled={form?.submitting || !email || requestLocked}
        >
            Invia richiesta
        </Button>
    );
}

export default function ForgotPasswordModal({ onClose }) {
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [requestLocked, setRequestLocked] = useState(false);
    const [alreadyRequested, setAlreadyRequested] = useState(false);

    return (
        <Card className="w-[460px] max-w-[92vw] modal-animation">
            <h2 className="text-2xl font-bold mb-4 text-brand-primary">
                Password dimenticata
            </h2>

            <p className="text-sm text-brand-textSecondary mb-4 leading-relaxed">
                Inserisci la tua email del gestionale.
                <br />
                Il super user riceverà la richiesta e imposterà una password
                temporanea.
            </p>

            {successMessage && (
                <AlertBox
                    variant={alreadyRequested ? 'warning' : 'success'}
                    title={
                        alreadyRequested
                            ? 'Richiesta già presente'
                            : 'Richiesta inviata'
                    }
                    className="mb-4"
                >
                    {successMessage}
                </AlertBox>
            )}

            {errorMessage && (
                <AlertBox
                    variant="error"
                    title="Impossibile inviare la richiesta"
                    className="mb-4"
                >
                    {errorMessage}
                </AlertBox>
            )}

            <Form
                initialValues={{ email: '' }}
                validate={{
                    email: (v) => {
                        const value = String(v ?? '').trim();
                        if (!value) return 'Obbligatorio';
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            return 'Email non valida';
                        }
                        return null;
                    },
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values) => {
                    setSuccessMessage('');
                    setErrorMessage('');
                    setAlreadyRequested(false);

                    const result = await withLoaderNotify({
                        message: 'Invio richiesta in corso…',
                        mode: 'blocking',
                        success: '',
                        errorTitle: 'Errore invio richiesta',
                        errorMessage:
                            'Non è stato possibile inviare la richiesta.',
                        fn: async () => {
                            return await requestPasswordReset(values.email);
                        },
                    });

                    if (!result.ok) {
                        setErrorMessage(
                            result.error?.message || 'Errore imprevisto',
                        );
                        setRequestLocked(false);
                        return;
                    }

                    if (result.data?.alreadyRequested) {
                        setAlreadyRequested(true);
                        setRequestLocked(true);
                        setSuccessMessage(
                            result.data?.message ||
                                'Hai già inviato una richiesta di reset password.',
                        );
                        return;
                    }

                    setAlreadyRequested(false);
                    setRequestLocked(true);
                    setSuccessMessage(
                        result.data?.message ||
                            'Il super user gestirà la tua richiesta appena possibile.',
                    );
                }}
            >
                <FormGroup label="Email" name="email" required>
                    <Input
                        name="email"
                        type="text"
                        placeholder="Inserisci la tua email"
                        className="w-full"
                        onChangeCapture={() => {
                            if (requestLocked) {
                                setRequestLocked(false);
                                setAlreadyRequested(false);
                                setSuccessMessage('');
                                setErrorMessage('');
                            }
                        }}
                    />
                </FormGroup>

                <div className="flex justify-end gap-2 mt-5">
                    <Button variant="underline" type="button" onClick={onClose}>
                        Chiudi
                    </Button>
                    <SubmitButton requestLocked={requestLocked} />
                </div>
            </Form>
        </Card>
    );
}
