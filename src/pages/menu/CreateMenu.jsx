import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import DateRangePicker from '../../components/ui/DateRangePicker';
import Button from '../../components/ui/Button';

import { useNavigate } from 'react-router-dom';

import WarningNote from '../../components/menu/WarningNote';
import DashedDivider from '../../components/menu/DashedDivider';

import {
    checkMenuNameExists,
    checkMenuDatesOverlap,
    createMenu,
} from '../../services/menusApi';

export default function CreateMenu() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE MENÙ">
            <h1 className="text-3xl font-semibold">Creazione nuovo menù</h1>

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
                            : v.trim().length < 3
                              ? 'Nome troppo corto'
                              : v.trim().length > 100
                                ? 'Nome troppo lungo'
                                : null,
                    start_date: (v) => (!v ? 'Obbligatorio' : null),
                    end_date: (v) => (!v ? 'Obbligatorio' : null),
                }}
                asyncValidate={{
                    name: async (value) => {
                        const v = (value ?? '').trim();
                        if (!v) return null;
                        if (v.length < 3) return null;

                        try {
                            const data = await checkMenuNameExists(v);
                            return data?.exists
                                ? 'Questo nome è già in uso'
                                : null;
                        } catch {
                            return 'Impossibile verificare il nome (server non raggiungibile)';
                        }
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

                    try {
                        const overlapData = await checkMenuDatesOverlap(
                            start_date,
                            end_date,
                        );

                        if (overlapData?.overlap) {
                            form.setFieldError(
                                'start_date',
                                'Intervallo date già in uso',
                            );
                            form.setFieldError(
                                'end_date',
                                `Intervallo già usato nel menù "${overlapData.season_type}"`,
                            );
                            return;
                        }

                        await createMenu({ name, start_date, end_date });

                        alert('Menù creato correttamente');
                        navigate('/menu');
                    } catch (e) {
                        console.error('Errore creazione menù:', e);
                        alert(e.message || 'Errore creazione menù');
                    }
                }}
            >
                <Card className="mt-6">
                    <FormGroup label="Nome" name="name" required>
                        <div className="flex items-center gap-6">
                            <div className="w-1/2">
                                <Input name="name" asyncValidate />
                            </div>
                            <div className="w-1/2">
                                <WarningNote>
                                    Il nome del menù deve essere diverso dai
                                    nomi di altri menù attivi o futuri.
                                </WarningNote>
                            </div>
                        </div>
                    </FormGroup>

                    <DashedDivider className="mt-10 mb-8" />

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
                                <WarningNote>
                                    Le date di inizio e fine del menù corrente
                                    non si devono sovrapporre con le date di
                                    altri menù attivi o futuri.
                                </WarningNote>
                            </div>
                        </div>
                    </FormGroup>

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
