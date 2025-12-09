import AppLayout from '../../components/layout/AppLayout';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import MultiSelectCheckbox from '../../components/ui/MultiSelectCheckbox';

export default function DishesList() {
    const [query, setQuery] = useState('');

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Elenco piatti</h1>

            {/* BARRA FILTRI */}
            <div className="my-4 bg-brand-primary h-[45px] flex justify-between items-center px-2">
                {/* SEARCH */}
                <SearchInput
                    placeholder="Cerca un piatto per nome..."
                    onSearch={setQuery}
                    className="w-[300px]"
                />

                {/* SELECTS */}
                <Form
                    initialValues={{ stato: '', allergeni: [], tipologia: '' }}
                    onSubmit={() => {}}
                >
                    <div className="flex items-center gap-3">
                        {/* STATO */}
                        <FormGroup name="stato" className="w-[145px]">
                            <CustomSelect
                                name="stato"
                                placeholder="Stato piatto"
                                options={[
                                    { value: '', label: '— Stato —' },
                                    { value: 'attivo', label: 'Attivo' },
                                    { value: 'sospeso', label: 'Sospeso' },
                                    { value: 'inattivo', label: 'Inattivo' },
                                ]}
                                height="h-[45px]"
                                className="w-full"
                            />
                        </FormGroup>

                        {/* ALLERGENI */}
                        <FormGroup name="allergeni" className="w-[180px]">
                            <MultiSelectCheckbox
                                name="allergeni"
                                placeholder="Allergeni esclusi"
                                options={[
                                    { value: 'glutine', label: 'Glutine' },
                                    {
                                        value: 'latte',
                                        label: 'Latte / Lattosio',
                                    },
                                    { value: 'uova', label: 'Uova' },
                                    { value: 'arachidi', label: 'Arachidi' },
                                    {
                                        value: 'frutta a guscio',
                                        label: 'Frutta a guscio',
                                    },
                                    { value: 'pesce', label: 'Pesce' },
                                    { value: 'crostacei', label: 'Crostacei' },
                                    { value: 'molluschi', label: 'Molluschi' },
                                    { value: 'soia', label: 'Soia' },
                                    { value: 'sedano', label: 'Sedano' },
                                    {
                                        value: 'sesamo',
                                        label: 'Semi di sesamo',
                                    },
                                    {
                                        value: 'anidride solforosa e solfiti',
                                        label: 'Anidride solforosa e solfiti',
                                    },
                                    { value: 'lupini', label: 'Lupini' },
                                ]}
                                height="h-[45px]"
                            />
                        </FormGroup>

                        {/* TIPI DI PIATTO */}
                        <FormGroup name="tipologia" className="w-[145px]">
                            <CustomSelect
                                name="tipologia"
                                placeholder="Tutti i tipi"
                                options={[
                                    { value: '', label: '— Tipologia —' },
                                    { value: 'primo', label: 'Primo' },
                                    { value: 'secondo', label: 'Secondo' },
                                    { value: 'contorno', label: 'Contorno' },
                                    { value: 'ultimo', label: 'Ultimo' },
                                    { value: 'speciale', label: 'Speciale' },
                                    { value: 'coperto', label: 'coperto' },
                                ]}
                                height="h-[45px]"
                                className="w-full"
                            />
                        </FormGroup>
                    </div>
                </Form>
            </div>

            <p>Elenco dei piatti qui.</p>
            <NavLink
                to={`/dishes/edit/18`}
                className="px-3 py-1 bg-brand-primary text-white rounded-md hover:bg-brand-primaryHover transition"
            >
                Modifica
            </NavLink>
        </AppLayout>
    );
}
