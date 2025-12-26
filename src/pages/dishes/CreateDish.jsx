import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import CustomSelect from '../../components/ui/CustomSelect';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import DatePicker from '../../components/ui/DatePicker';
import DateRangePicker from '../../components/ui/DateRangePicker';
import Card from '../../components/ui/Card';
import ImageUploader from '../../components/ui/ImageUploader';
import AllergenCheckboxGroup from '../../components/ui/AllergenCheckboxGroup';
import { isDecimal, isPositive } from '../../utils/validators';
import { validateMacrosVsGrammage } from '../../utils/validators';
import { useNavigate } from 'react-router-dom';

export default function DishesList() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Crea un piatto nuovo</h1>

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
                        if (!v) return null;

                        // non chiamare il server per stringhe troppo corte
                        if (v.length < 3) return null;

                        const res = await fetch(
                            `/api/dishes/exists?name=${encodeURIComponent(v)}`
                        );

                        if (!res.ok) {
                            return 'Impossibile verificare il nome (server non raggiungibile)';
                        }

                        const data = await res.json();
                        return data.exists ? 'Questo nome è già in uso' : null;
                    },
                }}
                validateForm={validateMacrosVsGrammage}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values) => {
                    const formData = new FormData();

                    Object.entries(values).forEach(([key, value]) => {
                        if (value !== null && value !== '') {
                            if (Array.isArray(value)) {
                                value.forEach((v) =>
                                    formData.append(`${key}[]`, v)
                                );
                            } else {
                                formData.append(key, value);
                            }
                        }
                    });

                    const res = await fetch('/api/dishes', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!res.ok) {
                        alert('Errore creazione piatto');
                        return;
                    }

                    alert('Piatto creato correttamente');

                    // vai alla lista
                    navigate('/dishes');
                }}
            >
                <Card className="mt-6">
                    <div className="flex items-start gap-8">
                        <div className="w-2/3">
                            <FormGroup label="Nome piatto" name="name" required>
                                <Input
                                    name="name"
                                    asyncValidate
                                    className="w-full"
                                />
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
                        {/* SINISTRA: immagine */}
                        <div className="w-1/5">
                            <FormGroup label="Immagine" required name="img">
                                <ImageUploader name="img" />
                            </FormGroup>
                        </div>

                        {/* DESTRA: macro + kcal */}
                        <div className="w-4/5 flex flex-col gap-4">
                            {/* Riga 1: Grammatura + Kcal */}
                            <div className="flex gap-4">
                                <FormGroup
                                    label="Grammatura"
                                    name="grammage_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        name="grammage_tot"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup
                                    label="Kcal"
                                    name="kcal_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        name="kcal_tot"
                                        className="w-[200px]"
                                    />
                                </FormGroup>
                            </div>

                            {/* Riga 2: Proteine + Carboidrati + Grassi */}
                            <div className="flex gap-4">
                                <FormGroup
                                    label="Proteine"
                                    name="proteins"
                                    required
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        name="proteins"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup
                                    label="Carboidrati"
                                    name="carbohydrates"
                                    required
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        name="carbohydrates"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup label="Grassi" name="fats" required>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        name="fats"
                                        className="w-[200px]"
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <FormGroup
                            label="Allergeni"
                            name="allergy_notes"
                            labelClassName="mb-2"
                        >
                            <AllergenCheckboxGroup name="allergy_notes" />
                        </FormGroup>
                    </div>
                </Card>

                {/* BOTTONE AGGIUNGI PIATTO */}
                <div className="flex justify-center mt-6">
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
        </AppLayout>
    );
}
