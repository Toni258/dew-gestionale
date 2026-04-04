// Page used to create a new dish.
// Validation and FormData mapping live in shared helpers so create/edit stay aligned.
import { useNavigate } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import DishFormFields from '../../components/dishes/DishFormFields';

import { withLoaderNotify } from '../../services/withLoaderNotify';
import { checkDishNameExists, createDish } from '../../services/dishesApi';
import {
    getDishFieldValidators,
    validateDishForm,
} from '../../utils/dishes/dishFormValidation';
import { buildDishFormData } from '../../utils/dishes/dishFormData';

const DISH_VALIDATORS = getDishFieldValidators({ requireImage: true });

export default function CreateDish() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE PIATTI">
            <div className="mx-auto w-full max-w-7xl">
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
                    validate={DISH_VALIDATORS}
                    asyncValidate={{
                        name: async (value) => {
                            const normalizedValue = (value ?? '').trim();
                            if (
                                !normalizedValue ||
                                normalizedValue.length < 3
                            ) {
                                return null;
                            }

                            try {
                                const data =
                                    await checkDishNameExists(normalizedValue);
                                return data.exists
                                    ? 'Questo nome è già in uso'
                                    : null;
                            } catch {
                                return 'Impossibile verificare il nome (server non raggiungibile)';
                            }
                        },
                    }}
                    validateForm={(values) => validateDishForm(values)}
                    validateOnBlur
                    validateOnSubmit
                    onSubmit={async (values) => {
                        const result = await withLoaderNotify({
                            message: 'Creazione piatto…',
                            mode: 'blocking',
                            success: 'Piatto creato correttamente',
                            errorTitle: 'Errore creazione piatto',
                            errorMessage:
                                'Impossibile creare il piatto, riprova.',
                            fn: async () => {
                                return createDish(buildDishFormData(values));
                            },
                        });

                        if (result.ok) {
                            navigate('/dishes');
                        }
                    }}
                >
                    <DishFormFields existingImageUrl={null} />

                    <div className="mt-6 flex justify-center rounded-md">
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
