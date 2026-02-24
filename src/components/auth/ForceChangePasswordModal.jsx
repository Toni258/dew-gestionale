import Card from '../ui/Card';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';

import Form, { useFormContext } from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import Input from '../ui/Input';

import { useAuth } from '../../context/AuthContext';

function FormGlobalError() {
    const form = useFormContext();
    const err = (form?.errors?.form ?? '').toString().trim();
    if (!err) return null;

    return (
        <div className="mb-2">
            <AlertBox variant="error" title="Attenzione">
                {err}
            </AlertBox>
        </div>
    );
}

function ExitButton({ onExit }) {
    const form = useFormContext();
    return (
        <Button
            type="button"
            variant="underline"
            onClick={onExit}
            disabled={form?.submitting}
        >
            Esci
        </Button>
    );
}

function SubmitButton() {
    const form = useFormContext();

    const newPassword = form?.values?.newPassword ?? '';
    const confirmPassword = form?.values?.confirmPassword ?? '';

    const canSubmit =
        newPassword &&
        confirmPassword &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword;

    return (
        <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={form?.submitting || !canSubmit}
            className="min-w-[190px]"
        >
            {form?.submitting ? 'Salvataggio...' : 'Salva nuova password'}
        </Button>
    );
}

export default function ForceChangePasswordModal() {
    const { user, mustChangePassword, changePassword, logout } = useAuth();
    if (!user || !mustChangePassword) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <Card className="relative w-full max-w-[520px] modal-animation overflow-hidden rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-brand-divider/60">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <span className="text-2xl">🔒</span>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-brand-primary leading-tight">
                                Cambio password obbligatorio
                            </h2>
                            <p className="text-sm text-brand-textSecondary mt-1">
                                Stai usando una password temporanea. Imposta una
                                nuova password per continuare.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <Form
                        className="flex flex-col gap-3"
                        initialValues={{
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                        }}
                        validate={{
                            currentPassword: (v) =>
                                !v ? 'Obbligatorio' : null,
                            newPassword: (v, all) => {
                                if (!v) return 'Obbligatorio';
                                if (v.length < 8) return 'Minimo 8 caratteri';
                                if (v === all.currentPassword)
                                    return 'La nuova password deve essere diversa da quella attuale';
                                return null;
                            },
                            confirmPassword: (v, all) => {
                                if (!v) return 'Obbligatorio';
                                if (v !== all.newPassword)
                                    return 'Le password non coincidono';
                                return null;
                            },
                        }}
                        validateOnBlur
                        validateOnSubmit
                        onSubmit={async (values, formCtx) => {
                            formCtx?.setFieldError?.('form', null);

                            try {
                                await changePassword(
                                    values.currentPassword,
                                    values.newPassword,
                                );
                                // quando status diventa active, il modale sparisce da solo
                            } catch (e) {
                                formCtx?.setFieldError?.(
                                    'form',
                                    e?.message || 'Errore cambio password',
                                );
                            }
                        }}
                    >
                        <FormGlobalError />

                        {/* Info box */}
                        <div className="rounded-xl border border-brand-divider/70 bg-brand-background/40 px-4 py-3">
                            <p className="text-sm text-brand-text">
                                Requisiti:
                            </p>
                            <ul className="mt-1 text-sm text-brand-textSecondary list-disc ml-5 space-y-0.5">
                                <li>Almeno 8 caratteri</li>
                                <li>Usa qualcosa di difficile da indovinare</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <FormGroup
                                label="Password attuale (temporanea)"
                                name="currentPassword"
                            >
                                <Input
                                    name="currentPassword"
                                    type="password"
                                    placeholder="Inserisci la password attuale"
                                    className="w-full"
                                />
                            </FormGroup>

                            <FormGroup
                                label="Nuova password"
                                name="newPassword"
                            >
                                <Input
                                    name="newPassword"
                                    type="password"
                                    placeholder="Inserisci la nuova password"
                                    className="w-full"
                                />
                            </FormGroup>

                            <FormGroup
                                label="Conferma nuova password"
                                name="confirmPassword"
                            >
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Conferma la nuova password"
                                    className="w-full"
                                />
                            </FormGroup>
                        </div>

                        {/* Footer */}
                        <div className="mt-2 pt-4 border-t border-brand-divider/60 flex flex-col gap-6 items-center justify-between">
                            <div className="text-sm text-brand-textSecondary">
                                Questa operazione è necessaria per proseguire.
                            </div>

                            <div className="flex gap-2">
                                <ExitButton onExit={logout} />
                                <SubmitButton />
                            </div>
                        </div>
                    </Form>
                </div>
            </Card>
        </div>
    );
}
