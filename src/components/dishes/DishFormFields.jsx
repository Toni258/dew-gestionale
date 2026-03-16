// Dish form fields.
import FormGroup from '../ui/FormGroup';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import Card from '../ui/Card';
import ImageUploader from '../ui/ImageUploader';
import AllergenCheckboxGroup from '../ui/AllergenCheckboxGroup';

export default function DishFormFields({ existingImageUrl }) {
    return (
        <Card className="mt-4">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <div className="w-full lg:w-2/3">
                    <FormGroup label="Nome piatto" name="name" required>
                        <Input name="name" className="w-full" asyncValidate />
                    </FormGroup>
                </div>

                <div className="w-full lg:w-1/3">
                    <FormGroup label="Tipo" name="type" required>
                        <CustomSelect
                            name="type"
                            options={[
                                { value: '', label: '— Seleziona un tipo —' },
                                { value: 'primo', label: 'Primo' },
                                { value: 'secondo', label: 'Secondo' },
                                { value: 'contorno', label: 'Contorno' },
                                { value: 'ultimo', label: 'Dessert' },
                                { value: 'speciale', label: 'Speciale' },
                                { value: 'coperto', label: 'Coperto' },
                            ]}
                        />
                    </FormGroup>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-8 xl:flex-row xl:items-center">
                <div className="w-full xl:w-1/5">
                    <FormGroup label="Immagine" name="img">
                        <ImageUploader
                            name="img"
                            initialUrl={existingImageUrl}
                        />
                    </FormGroup>
                </div>

                <div className="flex w-full flex-col gap-4 xl:w-4/5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <FormGroup label="Kcal" name="kcal_tot" required>
                            <Input type="number" step="0.001" name="kcal_tot" />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormGroup label="Proteine" name="proteins" required>
                            <Input type="number" step="0.001" name="proteins" />
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
                            <Input type="number" step="0.001" name="fats" />
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
    );
}
