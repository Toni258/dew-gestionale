import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Form from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ModifyUserPasswordModal({
    show,
    user,
    onClose,
    onConfirm,
}) {
    if (!show || !user) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[500px] flex flex-col items-center text-center">
                <span className="text-lg font-bold">
                    <span className="text-brand-text text-xl font-semibold">
                        Reimposta password per l'utente:
                    </span>{' '}
                    <span className="text-brand-primary">
                        {user.name} {user.surname}
                    </span>
                </span>

                <Form
                    className="mt-6 w-full flex gap-8"
                    initialValues={{
                        new_password: '',
                        confirm_new_password: '',
                    }}
                    validate={{
                        new_password: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.length < 3
                                  ? 'Troppo corto'
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
                    onSubmit={async (values) => {
                        const formData = new FormData();

                        const res = await fetch('/api/dishes', {
                            // Chiamata da implementare
                            method: 'POST',
                            body: formData,
                        });

                        if (!res.ok) {
                            alert('Errore modifica password utente');
                            return;
                        }

                        alert('Password modificata correttamente');
                        onClose();
                    }}
                >
                    <FormGroup label="Nuova password" name="new_password">
                        <Input type="password" className="w-full" />
                    </FormGroup>
                    <FormGroup
                        label="Conferma password"
                        name="confirm_new_password"
                    >
                        <Input type="password" className="w-full" />
                    </FormGroup>
                </Form>

                {/*
                
                <div className="flex justify-center gap-8">
                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={() => onConfirm(user)}
                        className={`
                            px-6 py-2 rounded-xl font-semibold text-white
                            transition
                            ${
                                isValid
                                    ? 'bg-red-600 hover:opacity-80'
                                    : 'bg-red-300 cursor-not-allowed'
                            }
                        `}
                    >
                        Reimposta password
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-brand-secondary text-white px-6 py-2 rounded-xl font-semibold"
                    >
                        Annulla
                    </button>
                </div>
                
                */}
            </div>
        </Modal>
    );
}
