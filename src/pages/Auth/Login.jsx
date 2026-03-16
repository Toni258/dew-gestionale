// Main page for login.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Form, { useFormContext } from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';

import ForgotPasswordModal from './ForgotPasswordModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AlertBox from '../../components/ui/AlertBox';

import { useAuth } from '../../context/AuthContext';
import { withLoaderNotify } from '../../services/withLoaderNotify';

// Bottone submit che legge lo stato del form (submitting + values)
function SubmitButton() {
    const form = useFormContext();
    const email = (form?.values?.email ?? '').trim();
    const password = form?.values?.password ?? '';

    return (
        <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-[85%]"
            disabled={form?.submitting || !email || !password}
        >
            {form?.submitting ? 'Accesso...' : 'Accedi'}
        </Button>
    );
}

export default function Login() {
    const location = useLocation();
    const reason = location.state?.reason;
    const from = location.state?.from;

    const navigate = useNavigate();
    const { login } = useAuth();
    // Main state used by the page

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [animateOut, setAnimateOut] = useState(false);
    const [error, setError] = useState('');

    // Helper function used by open forgot password.
    function openForgotPassword() {
        setAnimateOut(true);
        setTimeout(() => {
            setShowForgotPassword(true);
            setAnimateOut(false);
        }, 100);
    }

    // Helper function used by close forgot password.
    function closeForgotPassword() {
        setAnimateOut(true);
        setTimeout(() => {
            setShowForgotPassword(false);
            setAnimateOut(false);
        }, 100);
    }

    return (
        <div className="bg-brand-background h-screen flex items-center justify-center">
            {!showForgotPassword && (
                <Card
                    className={`flex flex-col items-center ${
                        animateOut ? 'fade-out' : 'modal-animation'
                    }`}
                >
                    {/* Logo + titolo */}
                    <div className="flex flex-row items-center">
                        <img
                            src="/Do Eat Well Logo Verde.png"
                            alt="logo"
                            className="w-[85px] h-[85px]"
                        />
                        <h1 className="text-3xl font-bold text-brand-primary">
                            DoEatWell Manager
                        </h1>
                    </div>

                    {reason === 'auth_required' && (
                        <div className="w-[85%] mt-6">
                            <AlertBox
                                variant="warning"
                                title="Accesso richiesto"
                            >
                                Devi effettuare l&apos;accesso per visualizzare
                                quella pagina.
                            </AlertBox>
                        </div>
                    )}

                    {reason === 'idle_logout' && (
                        <AlertBox
                            variant="warning"
                            title="Sessione scaduta per inattività"
                            className="w-[85%] mb-4"
                        >
                            Sei stato disconnesso automaticamente dopo 10 minuti
                            senza attività.
                        </AlertBox>
                    )}

                    {reason === 'password_reset_requested' && (
                        <AlertBox
                            variant="warning"
                            title="Reset password richiesto"
                            className="w-[85%] mb-4"
                        >
                            Hai richiesto il ripristino della password. Attendi
                            che il super user imposti una password temporanea.
                        </AlertBox>
                    )}

                    {/* FORM */}
                    <Form
                        className="w-full flex flex-col items-center"
                        initialValues={{ email: '', password: '' }}
                        validate={{
                            email: (v) =>
                                !v
                                    ? 'Obbligatorio'
                                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                                      ? 'Email non valida'
                                      : null,
                            password: (v) => (!v ? 'Obbligatorio' : null),
                        }}
                        validateOnBlur
                        validateOnSubmit
                        onSubmit={async (values) => {
                            setError('');

                            const res = await withLoaderNotify({
                                message: 'Accesso…',
                                mode: 'blocking',
                                errorTitle: 'Accesso non riuscito',
                                errorMessage:
                                    'Credenziali non valide o server non raggiungibile.',
                                fn: async () => {
                                    await login(values.email, values.password);
                                    return true;
                                },
                            });

                            if (!res.ok) {
                                setError(res.error?.message || 'Errore login');
                                return;
                            }

                            navigate(from || '/dashboard', { replace: true });
                        }}
                    >
                        <div className="w-[85%] mt-10 mb-2">
                            <FormGroup name="email">
                                <Input
                                    name="email"
                                    placeholder="Inserisci la tua email"
                                    type="email"
                                    className="w-full"
                                />
                            </FormGroup>
                        </div>

                        <div className="w-[85%] mt-2 mb-2">
                            <FormGroup name="password">
                                <Input
                                    name="password"
                                    placeholder="Inserisci la tua password"
                                    type="password"
                                    className="w-full"
                                />
                            </FormGroup>
                        </div>

                        {error && (
                            <div className="w-[85%] text-sm text-brand-error mb-3">
                                {error}
                            </div>
                        )}

                        {/* Link: password dimenticata */}
                        <div className="w-[85%] flex justify-end mb-2">
                            <button
                                type="button"
                                className="text-brand-textSecondary text-sm hover:underline"
                                onClick={openForgotPassword}
                            >
                                Password dimenticata?
                            </button>
                        </div>

                        <SubmitButton />
                    </Form>
                </Card>
            )}

            {showForgotPassword && (
                <ForgotPasswordModal onClose={closeForgotPassword} />
            )}
        </div>
    );
}