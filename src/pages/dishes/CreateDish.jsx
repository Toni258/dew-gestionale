// src/pages/dishes/CreateDish.jsx
import { useNavigate } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import Button from '../../components/ui/Button';

import DishFormFields from '../../components/dishes/DishFormFields';

import { withLoaderNotify } from '../../services/withLoaderNotify';

import {
    isDecimal,
    isPositive,
    validateMacrosVsGrammage,
} from '../../utils/validators';
import { checkDishNameExists } from '../../services/dishesApi';

export default function CreateDish() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE PIATTI">
            <div className="w-full max-w-7xl mx-auto">
                <h1 className="text-3xl font-semibold">Crea un piatto nuovo</h1>

                <div className="mt-6" />

                <Form
                    initialValues={{
                        name: '',
                        type: '',
                        img: null,
                        grammage_tot: '',
                        kcal_tot: '',
                        proteins: '',
                        carbohydrates: '',
                        fats: '',
                        allergy_notes: [],
                    }}
                    validate={{
                        name: (v) =>
                            !v
                                ? 'Obbligatorio'
                                : v.length < 3
                                  ? 'Troppo corto'
                                  : null,
                        type: (v) => (!v ? 'Seleziona un tipo' : null),
                        img: (v) => (!v ? 'Carica un’immagine' : null),

                        grammage_tot: (v) =>
                            !v ? 'Obbligatorio' : isDecimal(v) || isPositive(v),
                        kcal_tot: (v) =>
                            !v ? 'Obbligatorio' : isDecimal(v) || isPositive(v),
                        proteins: (v) =>
                            !v ? 'Obbligatorio' : isDecimal(v) || isPositive(v),
                        carbohydrates: (v) =>
                            !v ? 'Obbligatorio' : isDecimal(v) || isPositive(v),
                        fats: (v) =>
                            !v ? 'Obbligatorio' : isDecimal(v) || isPositive(v),
                    }}
                    asyncValidate={{
                        name: async (value) => {
                            const v = (value ?? '').trim();
                            if (!v || v.length < 3) return null;

                            try {
                                const data = await checkDishNameExists(v);
                                return data.exists
                                    ? 'Questo nome è già in uso'
                                    : null;
                            } catch {
                                return 'Impossibile verificare il nome (server non raggiungibile)';
                            }
                        },
                    }}
                    validateForm={validateMacrosVsGrammage}
                    validateOnBlur
                    validateOnSubmit
                    onSubmit={async (values) => {
                        const formData = new FormData();

                        Object.entries(values).forEach(([key, value]) => {
                            if (value === null || value === '') return;

                            if (Array.isArray(value)) {
                                value.forEach((v) =>
                                    formData.append(`${key}[]`, v),
                                );
                            } else {
                                formData.append(key, value);
                            }
                        });

                        const result = await withLoaderNotify({
                            message: 'Creazione piatto…',
                            mode: 'blocking',
                            success: 'Piatto creato correttamente',
                            errorTitle: 'Errore creazione piatto',
                            errorMessage:
                                'Impossibile creare il piatto, riprova.',
                            fn: async () => {
                                const res = await fetch('/api/dishes', {
                                    method: 'POST',
                                    body: formData,
                                });

                                // provo a leggere un messaggio server (se c'è)
                                const json = await res.json().catch(() => null);

                                if (!res.ok) {
                                    throw new Error(
                                        json?.message ||
                                            json?.error ||
                                            'Errore creazione piatto',
                                    );
                                }

                                return json;
                            },
                        });

                        if (result.ok) {
                            navigate('/dishes');
                        }
                    }}
                >
                    <DishFormFields existingImageUrl={null} />

                    <div className="flex justify-center mt-6 rounded-md">
                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="w-[200px]"
                        >
                            Aggiungi piatto
                        </Button>
                    </div>
                </Form>
            </div>
        </AppLayout>
    );
}
