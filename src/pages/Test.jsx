import { useState } from 'react';

import Form from '../components/ui/Form';
import FormGroup from '../components/ui/FormGroup';
import Input from '../components/ui/Input';
import CustomSelect from '../components/ui/CustomSelect';
import TextArea from '../components/ui/TextArea';
import Button from '../components/ui/Button';
import DatePicker from '../components/ui/DatePicker';
import DateRangePicker from '../components/ui/DateRangePicker';

export default function Test() {
    return (
        <div className="max-w-xl mx-auto p-10">
            <Form
                initialValues={{
                    name: '',
                    email: '',
                    category: '',
                    description: '',
                    date: '',
                    startDate: '',
                    endDate: '',
                }}
                validate={{
                    name: (v) =>
                        !v
                            ? 'Obbligatorio'
                            : v.length < 3
                            ? 'Troppo corto'
                            : null,
                    email: (v) =>
                        !v.includes('@') ? 'Email non valida' : null,
                    category: (v) => (!v ? 'Seleziona una categoria' : null),
                    date: (v) => (!v ? 'Seleziona una data' : null),
                    startDate: (v) => (!v ? 'Seleziona data inizio' : null),
                    endDate: (v) => (!v ? 'Seleziona data fine' : null),
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
                    email: async (value) => {
                        if (!value) return null;

                        // Simulazione API (1.5 secondi)
                        await new Promise((res) => setTimeout(res, 1500));

                        const emailsAlreadyUsed = ['toni258pl@gmail.com'];

                        return emailsAlreadyUsed.includes(value.toLowerCase())
                            ? 'Questa email è già in uso'
                            : null;
                    },
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={(values) => console.log(values)}
            >
                <FormGroup label="Nome piatto" required>
                    <Input name="name" asyncValidate />
                </FormGroup>

                <FormGroup label="Email" required className="mt-4">
                    <Input name="email" type="email" asyncValidate />
                </FormGroup>

                <FormGroup label="Categoria" required className="mt-4">
                    <CustomSelect
                        name="category"
                        options={[
                            { value: '', label: '— Seleziona una categoria —' },
                            { value: 'primo', label: 'Primo' },
                            { value: 'secondo', label: 'Secondo' },
                            { value: 'contorno', label: 'Contorno' },
                        ]}
                    />
                </FormGroup>

                <FormGroup label="Data" required className="mt-4">
                    <DatePicker name="date" />
                </FormGroup>

                <FormGroup label="Intervallo date" required className="mt-4">
                    <DateRangePicker
                        startName="startDate"
                        endName="endDate"
                        disablePast
                    />
                </FormGroup>

                <FormGroup label="Descrizione" className="mt-4">
                    <TextArea name="description" rows={5} />
                </FormGroup>

                <Button
                    type="submit"
                    size="lg"
                    variant="primary"
                    className="mt-6 w-full mt-6"
                >
                    Salva
                </Button>
            </Form>
        </div>
    );
}
