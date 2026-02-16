import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Form from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';

export default function ModifyUserPasswordModal({
    show,
    user,
    onClose,
    onConfirm,
}) {
    if (!show || !user) return null;

    return (
        <Modal onClose={onClose} contentClassName="w-[760px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 min-w-[500px] flex flex-col">
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text text-2xl font-semibold">
                        Reimposta password
                    </span>

                    <span className="text-lg font-semibold">
                        {'Utente: '}
                        <span className="text-brand-primary">
                            {user.name} {user.surname}
                        </span>
                    </span>
                </div>

                <Form
                    className="mt-6"
                    initialValues={{
                        new_password: '',
                        confirm_new_password: '',
                    }}
                    validate={{
                        new_password: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.length < 8
                                  ? 'Minimo 8 caratteri'
                                  : null,
                        confirm_new_password: (v, values) => {
                            if (!v) return 'Obbligatorio';
                            if (v !== values.new_password)
                                return 'Le password non coincidono';
                            return null;
                        },
                    }}
                    validateOnBlur
                    validateOnSubmit
                    onSubmit={onConfirm}
                >
                    <div className="flex flex-row justify-between w-full gap-12">
                        <FormGroup
                            label="Nuova password"
                            name="new_password"
                            required
                        >
                            <Input
                                name="new_password"
                                type="password"
                                className="w-[320px]"
                            />
                        </FormGroup>
                        <FormGroup
                            label="Conferma password"
                            name="confirm_new_password"
                            required
                        >
                            <Input
                                name="confirm_new_password"
                                type="password"
                                className="w-[320px]"
                            />
                        </FormGroup>
                    </div>

                    <div className="w-full flex justify-center mt-6">
                        <AlertBox
                            variant="info"
                            title="Nota importante"
                            className="w-[92%]"
                        >
                            L'utente riceverà un'email con le credenziali di
                            accesso temporanee. Sarà richiesto di modificare la
                            password al primo accesso.
                        </AlertBox>
                    </div>

                    <div className="flex mt-8 gap-6">
                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="rounded-lg"
                        >
                            Reimposta password
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
                </Form>
            </div>
        </Modal>
    );
}
