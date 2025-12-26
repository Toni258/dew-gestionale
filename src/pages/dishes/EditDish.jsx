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
import DatePicker from '../../components/ui/DatePicker';
import DateRangePicker from '../../components/ui/DateRangePicker';
import TextArea from '../../components/ui/TextArea';
import { hasDishChanged } from '../../utils/diffDish';
import { useFormContext } from '../../components/ui/Form';

import { isDecimal, isPositive } from '../../utils/validators';
import { validateMacrosVsGrammage } from '../../utils/validators';

export default function EditDish() {
    function StickySaveBar({ originalDish }) {
        const form = useFormContext();
        if (!form || !originalDish) return null;

        const changed = hasDishChanged(originalDish, form.values);

        return (
            <div
                className="
                sticky bottom-0 z-30
                -mx-6      /* annulla il padding di AppLayout del main */
                mt-10
                bg-white/95 backdrop-blur
                border-t border-brand-divider
            "
            >
                <div className="py-4 flex justify-center">
                    <Button
                        type="submit"
                        disabled={!changed}
                        className="w-[240px]"
                    >
                        Salva modifiche
                    </Button>
                </div>
            </div>
        );
    }

    const { dishId } = useParams();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [originalDish, setOriginalDish] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');

    const isEmpty = (v) => v === '' || v === null || v === undefined; // Serve perchè se no non riconosce 0 come valore valido nei macro

    useEffect(() => {
        const loadDish = async () => {
            try {
                const res = await fetch(`/api/dishes/${dishId}`);
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(
                        `GET /api/dishes/${dishId} -> ${res.status} ${text}`
                    );
                }

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

                    // sospensione
                    suspension_enabled: data.suspension ? true : false,
                    suspension_id: data.suspension?.id_avail ?? '',
                    start_date: data.suspension?.valid_from ?? '',
                    end_date: data.suspension?.valid_to ?? '',
                    reason: data.suspension?.reason ?? '',
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
            } catch (err) {
                console.error('loadDish error:', err);
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

    function SuspensionBlock() {
        const form = useFormContext();
        const enabled = !!form.values.suspension_enabled;

        return (
            <>
                {/* TITOLO + TOGGLE IOS */}
                <div className="mt-8 flex items-center gap-6">
                    <h2 className="text-3xl font-semibold">
                        Sospensione piatto
                    </h2>

                    <button
                        type="button"
                        onClick={() => {
                            form.setFieldValue('suspension_enabled', !enabled);

                            if (enabled) {
                                form.setFieldValue('start_date', '');
                                form.setFieldValue('end_date', '');
                                form.setFieldValue('reason', '');
                            }
                        }}
                        className={`
                        mt-2 relative w-12 h-7 rounded-full transition-colors
                        ${enabled ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                    >
                        <span
                            className={`
                            absolute top-1 left-1 w-5 h-5 bg-white rounded-full
                            transition-transform
                            ${enabled ? 'translate-x-5' : ''}
                        `}
                        />
                    </button>
                </div>

                {/* CARD SOSPENSIONE */}
                <Card className="mt-4 relative overflow-visible">
                    {!enabled && (
                        <div className="absolute inset-0 z-10 bg-gray-200/70 rounded-xl" />
                    )}

                    <div className="flex gap-6 relative z-0">
                        <div className="w-1/6 flex flex-col gap-4">
                            <FormGroup label="Data inizio" required={enabled}>
                                <DatePicker
                                    name="start_date"
                                    disabled={!enabled}
                                />
                            </FormGroup>

                            <FormGroup label="Data fine" required={enabled}>
                                <DatePicker
                                    name="end_date"
                                    disabled={!enabled}
                                />
                            </FormGroup>
                        </div>

                        <div className="w-5/6">
                            <FormGroup label="Motivo">
                                <TextArea
                                    name="reason"
                                    placeholder="Motivo della sospensione del piatto (consigliato)"
                                    rows={5}
                                    disabled={!enabled}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </Card>
            </>
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
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    kcal_tot: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    proteins: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    carbohydrates: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    fats: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
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
                validateForm={(values) => {
                    const errs = validateMacrosVsGrammage(values) || {};

                    if (values.suspension_enabled) {
                        if (!values.start_date)
                            errs.start_date = 'Obbligatorio';
                        if (!values.end_date) errs.end_date = 'Obbligatorio';
                        if (
                            values.start_date &&
                            values.end_date &&
                            values.end_date < values.start_date
                        ) {
                            errs.end_date =
                                'La data fine deve essere >= data inizio';
                        }
                    }

                    return Object.keys(errs).length ? errs : null;
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values) => {
                    // controlla se qualcosa è cambiato
                    const changed = hasDishChanged(originalDish, values);
                    const suspensionEnabled = !!values.suspension_enabled;

                    // se NON è cambiato nulla
                    if (!changed && !values.img) {
                        alert('Nessuna modifica da salvare');
                        navigate('/dishes');
                        return;
                    }

                    const formData = new FormData();
                    const payload = {
                        ...values,
                        suspension_enabled: values.suspension_enabled
                            ? '1'
                            : '0',
                    };

                    Object.entries(payload).forEach(([key, value]) => {
                        if (value === null || value === '') return;

                        // non mandare la stringa dell'immagine
                        if (key === 'img' && typeof value === 'string') return;

                        // se toggle OFF, non mandare questi campi
                        if (
                            !suspensionEnabled &&
                            ['start_date', 'end_date', 'reason'].includes(key)
                        ) {
                            return;
                        }

                        // checkbox -> manda 1/0
                        if (key === 'suspension_enabled') {
                            formData.append(
                                'suspension_enabled',
                                suspensionEnabled ? '1' : '0'
                            );
                            return;
                        }

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
                <Card className="mt-4">
                    <div className="flex items-start gap-8">
                        <div className="w-2/3">
                            <FormGroup label="Nome piatto" name="name" required>
                                <Input name="name" className="w-full" />
                            </FormGroup>
                        </div>

                        <div className="w-1/3">
                            <FormGroup label="Tipo" name="type" required>
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
                            <FormGroup label="Immagine" name="img">
                                <ImageUploader
                                    name="img"
                                    initialUrl={existingImageUrl}
                                />
                            </FormGroup>
                        </div>

                        <div className="w-4/5 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <FormGroup
                                    label="Grammatura"
                                    name="grammage_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="grammage_tot"
                                    />
                                </FormGroup>
                                <FormGroup
                                    label="Kcal"
                                    name="kcal_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="kcal_tot"
                                    />
                                </FormGroup>
                            </div>

                            <div className="flex gap-4">
                                <FormGroup
                                    label="Proteine"
                                    name="proteins"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="proteins"
                                    />
                                </FormGroup>
                                <FormGroup
                                    label="Carboidrati"
                                    name="carbohydrates"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="carbohydrates"
                                    />
                                </FormGroup>
                                <FormGroup label="Grassi" name="fats" required>
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

                <SuspensionBlock />

                <StickySaveBar originalDish={originalDish} />
            </Form>
        </AppLayout>
    );
}
