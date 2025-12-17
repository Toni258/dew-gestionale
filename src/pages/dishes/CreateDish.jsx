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

export default function DishesList() {
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
                }}
                asyncValidate={{
                    name: async (value) => {
                        if (!value) return null;

                        // Simulazione API (1.5 secondi)
                        await new Promise((res) => setTimeout(res, 1500));

                        const namesAlreadyUsed = [
                            'pasta al sugo',
                            'risotto',
                            'pollo arrosto',
                        ];

                        return namesAlreadyUsed.includes(value.toLowerCase())
                            ? 'Questo nome è già in uso'
                            : null;
                    },
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={(values) => {
                    const formData = new FormData();

                    Object.entries(values).forEach(([key, value]) => {
                        if (value !== null && value !== '') {
                            formData.append(key, value);
                        }
                    });

                    console.log('FormData ready:', formData);
                }}
            >
                <Card className="mt-6">
                    <div className="flex items-start gap-8">
                        <div className="w-2/3">
                            <FormGroup label="Nome piatto" required>
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
                                <FormGroup label="Grammatura">
                                    <Input
                                        name="grammage_tot"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup label="Kcal">
                                    <Input name="kcal" className="w-[200px]" />
                                </FormGroup>
                            </div>

                            {/* Riga 2: Proteine + Carboidrati + Grassi */}
                            <div className="flex gap-4">
                                <FormGroup label="Proteine">
                                    <Input
                                        name="proteins"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup label="Carboidrati">
                                    <Input
                                        name="carbohydrates"
                                        className="w-[200px]"
                                    />
                                </FormGroup>

                                <FormGroup label="Grassi">
                                    <Input name="fats" className="w-[200px]" />
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
