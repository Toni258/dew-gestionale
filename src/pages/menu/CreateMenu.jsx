import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import DateRangePicker from '../../components/ui/DateRangePicker';
import Button from '../../components/ui/Button';

import { useNavigate } from 'react-router-dom';

export default function CreateMenu() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
            <h1 className="text-3xl font-semibold mx-8">
                Creazione nuovo menù
            </h1>

            <Form
                initialValues={{
                    name: '',
                    start_date: '',
                    end_date: '',
                }}
                validate={{
                    name: (v) =>
                        !v
                            ? 'Obbligatorio'
                            : v.length < 3
                            ? 'Nome troppo lungo'
                            : v.length > 100
                            ? 'Nome troppo corto'
                            : null,
                    start_date: (v) => (!v ? 'Obbligatorio' : null),
                    end_date: (v) => (!v ? 'Obbligatorio' : null),
                }}
                asyncValidate={{
                    name: async (value) => {
                        const v = (value ?? '').trim();
                        if (!v) return null;

                        // non chiamare il server per stringhe troppo corte
                        if (v.length < 3) return null;

                        // Verifica se il nome del menù esiste già
                        const res = await fetch(
                            `/api/menus/exists?name=${encodeURIComponent(v)}`
                        );

                        if (!res.ok) {
                            return 'Impossibile verificare il nome (server non raggiungibile)';
                        }

                        const data = await res.json();
                        return data.exists ? 'Questo nome è già in uso' : null;
                    },
                }}
                validateForm={(values) => {
                    const errs = {};

                    const { start_date, end_date } = values;

                    if (start_date && end_date && end_date < start_date) {
                        errs.end_date =
                            'La data fine deve essere ≥ della data di inizio';
                    }

                    return Object.keys(errs).length ? errs : null;
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values, form) => {
                    const { start_date, end_date, name } = values;

                    const overlapRes = await fetch(
                        `/api/menus/dates-overlap?start_date=${encodeURIComponent(
                            start_date
                        )}&end_date=${encodeURIComponent(end_date)}`
                    );

                    if (!overlapRes.ok) {
                        alert('Impossibile verificare le date');
                        return;
                    }

                    const overlapData = await overlapRes.json();

                    if (overlapData.overlap) {
                        form.setFieldError(
                            'start_date',
                            'Intervallo date già in uso'
                        );
                        form.setFieldError(
                            'end_date',
                            `Intervallo già usato nel menù "${overlapData.season_type}"`
                        );
                        return;
                    }

                    // nessun overlap faccio submit
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

                    const res = await fetch('/api/menus', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(values),
                    });

                    if (!res.ok) {
                        let errorMsg = 'Errore creazione menù';

                        try {
                            const data = await res.json();
                            if (data?.error) errorMsg = data.error;
                        } catch (e) {
                            // risposta non JSON
                        }

                        console.error('Errore API /api/menus:', errorMsg);
                        alert(errorMsg);
                        return;
                    }

                    alert('Menù creato correttamente');

                    // vai alla lista
                    navigate('/menu');
                }}
            >
                <Card className="mt-6 mx-8">
                    <FormGroup label="Nome" name="name" required>
                        <div className="flex items-center gap-6">
                            <div className="w-1/2">
                                <Input name="name" asyncValidate />
                            </div>
                            <div className="w-1/2">
                                <div className="flex items-center gap-4">
                                    <img
                                        src="/warning giallo.png"
                                        className="w-5 h-5"
                                        alt="Avvertenza"
                                    />
                                    <h2 className="text-brand-textSecondary">
                                        Il nome del menù deve essere diverso dai
                                        nomi di altri menù attivi o futuri.
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </FormGroup>

                    {/* Divider tratteggiato */}
                    <div className="mt-10 mb-8 h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                    <FormGroup label="Intervallo date" required>
                        <div className="flex gap-6">
                            <div className="w-1/2">
                                <DateRangePicker
                                    startName="start_date"
                                    endName="end_date"
                                    disablePast
                                />
                            </div>
                            <div className="w-1/2">
                                <div className="flex items-center gap-4 ">
                                    <img
                                        src="/warning giallo.png"
                                        className="w-5 h-5"
                                        alt="Avvertenza"
                                    />
                                    <h2 className="text-brand-textSecondary">
                                        Le date di inizio e fine del menù
                                        corrente non si devono sovrapporre con
                                        le date di altri menù attivi o futuri.
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </FormGroup>

                    {/* BOTTONE CREA MENU' */}
                    <div className="flex justify-center mt-10">
                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="w-[200px] text-lg"
                        >
                            Crea menù
                        </Button>
                    </div>
                </Card>
            </Form>
        </AppLayout>
    );
}
