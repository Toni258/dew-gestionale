// CreateUserGestionale.jsx
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Form, { useFormContext } from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';

import AlertBox from '../../components/ui/AlertBox';
import DashedDivider from '../../components/menu/DashedDivider';

import { notify } from '../../services/notify';
import { withLoader } from '../../services/withLoader';

import { useNavigate } from 'react-router-dom';

import {
    checkEmailExists,
    createUserGestionale,
} from '../../services/usersApi';

function FormGlobalError() {
    const form = useFormContext();
    const err = (form?.errors?.form ?? '').toString().trim();
    if (!err) return null;

    return (
        <AlertBox
            variant="error"
            title="Non è stato possibile creare l’utente"
            className="mb-6"
        >
            {err}
        </AlertBox>
    );
}

function SubmitButton() {
    const form = useFormContext();
    return (
        <Button
            type="submit"
            size="md"
            variant="primary"
            className="w-[240px] text-lg rounded-lg"
            disabled={form?.submitting}
        >
            {form?.submitting ? 'Creazione in corso…' : 'Crea utente'}
        </Button>
    );
}

function RoleHint() {
    const form = useFormContext();
    const role = form?.values?.role ?? '';

    const map = {
        operator: {
            title: (
                <>
                    Ruolo selezionato: <strong>Operatore</strong>
                </>
            ),
            text: (
                <>
                    <strong>Operatore</strong> ha accesso operativo alle
                    funzioni quotidiane, senza privilegi avanzati.
                </>
            ),
        },
        super_user: {
            title: (
                <>
                    Ruolo selezionato: <strong>Super User</strong>
                </>
            ),
            text: (
                <>
                    <strong>Super User</strong> può gestire configurazioni e
                    utenti. Da assegnare con cautela.
                </>
            ),
        },
    };

    const info = map[role];

    return (
        <AlertBox
            variant={role === 'super_user' ? 'warning' : 'info'}
            title={info ? info.title : 'Seleziona un ruolo'}
            className="h-full"
        >
            {info ? (
                info.text
            ) : (
                <>
                    Scegli <strong>Operatore</strong> per utilizzo standard
                    oppure <strong>Super User</strong> per permessi elevati.
                </>
            )}
        </AlertBox>
    );
}

export default function CreateUserGestionale() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE UTENTI">
            <div className="w-full max-w-3xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold">
                        Crea nuovo utente del gestionale
                    </h1>

                    <p className="text-sm text-brand-text/70">
                        Compila i dati anagrafici, assegna un ruolo e imposta
                        una password temporanea.
                    </p>
                </div>

                <Form
                    initialValues={{
                        role: '',
                        name: '',
                        surname: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                    }}
                    validate={{
                        role: (v) => (!v ? 'Obbligatorio' : null),

                        name: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.trim().length < 2
                                  ? 'Nome troppo corto'
                                  : v.trim().length > 100
                                    ? 'Nome troppo lungo'
                                    : null,

                        surname: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.trim().length < 2
                                  ? 'Cognome troppo corto'
                                  : v.trim().length > 100
                                    ? 'Cognome troppo lungo'
                                    : null,

                        email: (v) => {
                            if (!v) return 'Obbligatorio';
                            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return !re.test(v.trim())
                                ? 'Email non valida'
                                : null;
                        },

                        password: (v) => {
                            if (!v) return 'Obbligatorio';
                            if (v.length < 8) return 'Password troppo corta';
                            if (v.length > 64) return 'Password troppo lunga';
                            return null;
                        },

                        confirmPassword: (v) => (!v ? 'Obbligatorio' : null),
                    }}
                    asyncValidate={{
                        email: async (value) => {
                            const v = (value ?? '').trim().toLowerCase();
                            if (!v) return null;
                            if (v.length < 3) return null;

                            try {
                                const data = await checkEmailExists(v);
                                return data?.exists
                                    ? 'Questa email è già in uso'
                                    : null;
                            } catch (e) {
                                return "Impossibile verificare l'email (server non raggiungibile)";
                            }
                        },
                    }}
                    validateForm={(values) => {
                        const errs = {};
                        const pwd = values.password ?? '';
                        const cpwd = values.confirmPassword ?? '';
                        if (pwd && cpwd && pwd !== cpwd) {
                            errs.confirmPassword = 'Le password non coincidono';
                        }
                        return Object.keys(errs).length ? errs : null;
                    }}
                    validateOnBlur
                    validateOnSubmit
                    onSubmit={async (values, form) => {
                        try {
                            const payload = {
                                role: values.role,
                                name: values.name.trim(),
                                surname: values.surname.trim(),
                                email: values.email.trim().toLowerCase(),
                                password: values.password,
                            };

                            const res = await withLoader(
                                'Creazione utente…',
                                async () => {
                                    return await createUserGestionale(payload);
                                },
                                'blocking',
                            );

                            if (!res?.ok) {
                                throw new Error('Creazione utente fallita');
                            }

                            notify.success('Utente creato correttamente');
                            navigate('/user-manager/gestionale');
                        } catch (e) {
                            console.error('Errore creazione utente:', e);
                            form?.setFieldError?.(
                                'form',
                                e?.message || 'Errore creazione utente',
                            );
                            notify.error(
                                e?.message || 'Errore creazione utente',
                            );
                        }
                    }}
                >
                    <Card className="mt-6">
                        {/* Alert compatto (senza ripetere email univoca) */}
                        <AlertBox
                            variant="info"
                            title="Creazione utente"
                            className="mb-6"
                        >
                            Inserisci i dati richiesti e completa la creazione.
                            I controlli verranno eseguiti automaticamente.
                        </AlertBox>

                        <FormGlobalError />

                        {/* GRID PRINCIPALE */}
                        <div className="grid grid-cols-3 gap-6">
                            <FormGroup label="Nome" name="name" required>
                                <Input name="name" type="text" />
                            </FormGroup>

                            <FormGroup label="Cognome" name="surname" required>
                                <Input name="surname" type="text" />
                            </FormGroup>

                            <FormGroup label="Ruolo" name="role" required>
                                <CustomSelect
                                    name="role"
                                    placeholder="Seleziona ruolo"
                                    options={[
                                        { value: '', label: '— Seleziona —' },
                                        {
                                            value: 'operator',
                                            label: 'Operatore',
                                        },
                                        {
                                            value: 'super_user',
                                            label: 'Super User',
                                        },
                                    ]}
                                />
                            </FormGroup>

                            <div className="col-span-3">
                                <FormGroup label="Email" name="email" required>
                                    <Input
                                        name="email"
                                        type="text"
                                        asyncValidate
                                    />
                                </FormGroup>
                            </div>

                            <FormGroup
                                label="Password"
                                name="password"
                                required
                            >
                                <Input name="password" type="password" />
                            </FormGroup>

                            <FormGroup
                                label="Conferma"
                                name="confirmPassword"
                                required
                            >
                                <Input name="confirmPassword" type="password" />
                            </FormGroup>

                            <div className="flex items-end text-xs text-brand-text/60">
                                Min. 8 caratteri
                            </div>
                        </div>

                        {/* Separazione + area informativa (riempie lo spazio sotto in modo utile) */}
                        <DashedDivider className="my-6" />

                        <div className="grid grid-cols-2 gap-6">
                            <RoleHint />

                            <AlertBox
                                variant="info"
                                title="Suggerimento sicurezza"
                                className="h-full"
                            >
                                Consigliato comunicare la password in modo
                                sicuro e farla cambiare al primo accesso (se
                                previsto dal flusso).
                            </AlertBox>
                        </div>

                        <DashedDivider className="my-6" />

                        {/* Azioni */}
                        <div className="flex items-star justify-between">
                            <div className="flex items-center gap-4">
                                <SubmitButton />
                                <Button
                                    type="button"
                                    variant="underline"
                                    onClick={() =>
                                        navigate('/user-manager/gestionale')
                                    }
                                >
                                    Annulla
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Form>
            </div>
        </AppLayout>
    );
}
