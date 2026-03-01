import Modal from '../ui/Modal';
import Form, { useFormContext } from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';

function HDivider() {
    return (
        <div className="w-full flex justify-center mt-6 mb-4">
            <div className="w-[95%]">
                <div className="h-[1px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_10px,transparent_10px,transparent_18px)]" />
            </div>
        </div>
    );
}

function SubmitRow({ initialValues, onClose }) {
    const form = useFormContext();

    const values = form?.values || {};
    const errors = form?.errors || {};

    const isDirty =
        (values.name ?? '') !== (initialValues.name ?? '') ||
        (values.surname ?? '') !== (initialValues.surname ?? '') ||
        (values.email ?? '') !== (initialValues.email ?? '') ||
        (values.role ?? '') !== (initialValues.role ?? '');

    const hasErrors = Object.values(errors).some(Boolean);
    const disabled = !isDirty || hasErrors || form?.submitting;

    return (
        <div className="flex mt-8 gap-6">
            <Button
                type="submit"
                size="md"
                variant="primary"
                className="rounded-lg"
                disabled={disabled}
            >
                Conferma modifica
            </Button>

            <Button
                type="button"
                size="md"
                variant="secondary"
                className="rounded-lg"
                onClick={onClose}
            >
                Annulla
            </Button>
        </div>
    );
}

export default function ModifyUserInfoModal({
    show,
    user,
    onClose,
    onConfirm,
    ruoli,
}) {
    if (!show || !user) return null;

    const initialValues = {
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        role: user.role || 'Altro',
    };

    return (
        <Modal onClose={onClose} contentClassName="w-[760px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 min-w-[500px] flex flex-col">
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text text-2xl font-semibold">
                        Modifica dati
                    </span>

                    <span className="text-lg font-semibold">
                        Utente:{' '}
                        <span className="text-brand-primary">
                            {user.name} {user.surname}
                        </span>
                    </span>
                </div>

                <Form
                    className="mt-6"
                    initialValues={initialValues}
                    validate={{
                        name: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.length < 2
                                  ? 'Troppo corto'
                                  : null,
                        surname: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.length < 2
                                  ? 'Troppo corto'
                                  : null,
                        email: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                                  ? 'Email non valida'
                                  : null,
                        role: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : ![
                                        'super_user',
                                        'operator',
                                        'caregiver',
                                        'Altro',
                                    ].includes(v)
                                  ? 'Ruolo non valido'
                                  : null,
                    }}
                    validateOnBlur
                    validateOnSubmit
                    validateOnChange
                    onSubmit={(values) => {
                        onConfirm({
                            id: user.id,
                            ...values,
                        });
                    }}
                >
                    <div className="flex flex-row justify-between w-full gap-12">
                        <FormGroup label="Nome" name="name" required>
                            <Input
                                name="name"
                                type="text"
                                className="w-[320px]"
                            />
                        </FormGroup>

                        <FormGroup label="Cognome" name="surname" required>
                            <Input
                                name="surname"
                                type="text"
                                className="w-[320px]"
                            />
                        </FormGroup>
                    </div>

                    <HDivider />

                    <div className="flex flex-row justify-between w-full gap-12">
                        <FormGroup label="Email" name="email" required>
                            <Input
                                name="email"
                                type="text"
                                className="w-[320px]"
                            />
                        </FormGroup>

                        <FormGroup label="Ruolo" name="role" required>
                            <CustomSelect
                                name="role"
                                options={ruoli}
                                height="h-[45px]"
                                className="w-[320px] [&>div>button]:rounded-lg"
                            />
                        </FormGroup>
                    </div>

                    <SubmitRow
                        initialValues={initialValues}
                        onClose={onClose}
                    />
                </Form>
            </div>
        </Modal>
    );
}
