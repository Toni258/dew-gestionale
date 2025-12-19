import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import CustomSelect from '../../components/ui/CustomSelect';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/ui/ImageUploader';
import AllergenCheckboxGroup from '../../components/ui/AllergenCheckboxGroup';
import { hasDishChanged } from '../../utils/diffDish';

import { isDecimal, isPositive } from '../../utils/validators';
import { validateMacrosVsGrammage } from '../../utils/validators';

export default function EditDish() {
    const { dishId } = useParams();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [originalDish, setOriginalDish] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');

    useEffect(() => {
        const loadDish = async () => {
            try {
                const res = await fetch(`/api/dishes/${dishId}`);
                if (!res.ok) throw new Error();

                const data = await res.json();

                setExistingImageUrl(
                    data.image_url ? `/food-images/${data.image_url}` : ''
                );

                setInitialValues({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    img: data.image_url
                        ? `/food-images/${data.image_url}`
                        : null,
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],
                });

                setOriginalDish({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],
                });
            } catch {
                setError('Impossibile caricare il piatto');
            } finally {
                setLoading(false);
            }
        };

        loadDish();
    }, [dishId]);

    if (loading) {
        return (
            <AppLayout title="GESTIONE PIATTI" username="Antonio">
                <div>Caricamento…</div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE PIATTI" username="Antonio">
                <div className="text-brand-error">{error}</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Modifica del piatto</h1>

            <Form
                initialValues={initialValues}
                validate={{
                    name: (v) =>
                        !v
                            ? 'Obbligatorio'
                            : v.length < 3
                            ? 'Troppo corto'
                            : null,
                    type: (v) => (!v ? 'Seleziona un tipo' : null),

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

                        const res = await fetch(
                            `/api/dishes/exists?name=${encodeURIComponent(
                                v
                            )}&excludeId=${dishId}`
                        );

                        if (!res.ok) {
                            return 'Impossibile verificare il nome';
                        }

                        const data = await res.json();
                        return data.exists ? 'Questo nome è già in uso' : null;
                    },
                }}
                validateForm={validateMacrosVsGrammage}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values) => {
                    // controlla se qualcosa è cambiato
                    const changed = hasDishChanged(originalDish, values);

                    // se NON è cambiato nulla
                    if (!changed && !values.img) {
                        alert('Nessuna modifica da salvare');
                        navigate('/dishes');
                        return;
                    }

                    const formData = new FormData();

                    Object.entries(values).forEach(([key, value]) => {
                        if (value === null || value === '') return;

                        // non mandare la stringa dell'immagine
                        if (key === 'img' && typeof value === 'string') return;

                        if (Array.isArray(value)) {
                            value.forEach((v) =>
                                formData.append(`${key}[]`, v)
                            );
                        } else {
                            formData.append(key, value);
                        }
                    });

                    const res = await fetch(`/api/dishes/${dishId}`, {
                        method: 'PUT',
                        body: formData,
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        alert(
                            err.error || 'Errore aggiornamento piatto pagina'
                        );
                        return;
                    }

                    alert('Piatto aggiornato correttamente');
                    navigate('/dishes');
                }}
            >
                <Card className="mt-6">
                    <div className="flex items-start gap-8">
                        <div className="w-2/3">
                            <FormGroup label="Nome piatto" required>
                                <Input name="name" className="w-full" />
                            </FormGroup>
                        </div>

                        <div className="w-1/3">
                            <FormGroup label="Tipo" required>
                                <CustomSelect
                                    name="type"
                                    options={[
                                        {
                                            value: '',
                                            label: '— Seleziona un tipo —',
                                        },
                                        { value: 'primo', label: 'Primo' },
                                        { value: 'secondo', label: 'Secondo' },
                                        {
                                            value: 'contorno',
                                            label: 'Contorno',
                                        },
                                        { value: 'ultimo', label: 'Dessert' },
                                        {
                                            value: 'speciale',
                                            label: 'Speciale',
                                        },
                                        { value: 'coperto', label: 'Coperto' },
                                    ]}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-6">
                        <div className="w-1/5">
                            <FormGroup label="Immagine">
                                <ImageUploader
                                    name="img"
                                    initialUrl={existingImageUrl}
                                />
                            </FormGroup>
                        </div>

                        <div className="w-4/5 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <FormGroup label="Grammatura" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="grammage_tot"
                                    />
                                </FormGroup>
                                <FormGroup label="Kcal" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="kcal_tot"
                                    />
                                </FormGroup>
                            </div>

                            <div className="flex gap-4">
                                <FormGroup label="Proteine" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="proteins"
                                    />
                                </FormGroup>
                                <FormGroup label="Carboidrati" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="carbohydrates"
                                    />
                                </FormGroup>
                                <FormGroup label="Grassi" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="fats"
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <FormGroup label="Allergeni" name="allergy_notes">
                            <AllergenCheckboxGroup name="allergy_notes" />
                        </FormGroup>
                    </div>
                </Card>

                <div className="flex justify-center mt-6">
                    <Button type="submit" className="w-[220px]">
                        Salva modifiche
                    </Button>
                </div>
            </Form>
        </AppLayout>
    );
}
