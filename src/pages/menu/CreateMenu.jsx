import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Form, { useFormContext } from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import DateRangePicker from '../../components/ui/DateRangePicker';
import Button from '../../components/ui/Button';

import { useNavigate } from 'react-router-dom';

import AlertBox from '../../components/ui/AlertBox';
import DashedDivider from '../../components/menu/DashedDivider';

import {
    checkMenuNameExists,
    checkMenuDatesOverlap,
    createMenu,
} from '../../services/menusApi';

function FormGlobalError() {
    const form = useFormContext();
    const err = (form?.errors?.form ?? '').toString().trim();
    if (!err) return null;

    return (
        <AlertBox
            variant="error"
            title="Non è stato possibile creare il menù"
            className="mb-6"
        >
            {err}
        </AlertBox>
    );
}

function SubmitButton() {
    const form = useFormContext();
    return (
        <Button
            type="submit"
            size="md"
            variant="primary"
            className="w-[220px] text-lg rounded-lg"
            disabled={form?.submitting}
        >
            {form?.submitting ? 'Creazione in corso…' : 'Crea menù'}
        </Button>
    );
}

export default function CreateMenu() {
    const navigate = useNavigate();

    return (
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold">
                        Creazione nuovo menù
                    </h1>

                    <p className="text-sm text-brand-text/70">
                        Dai un nome al menù e scegli l’intervallo di validità.
                        Il sistema controllerà unicità e sovrapposizioni.
                    </p>
                </div>

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
                                form?.setFieldError?.(
                                    'start_date',
                                    'Intervallo date già in uso',
                                );
                                form?.setFieldError?.(
                                    'end_date',
                                    `Intervallo già usato nel menù "${overlapData.season_type}"`,
                                );
                                return;
                            }

                            const res = await createMenu({
                                name: name.trim(),
                                start_date,
                                end_date,
                            });

                            if (res?.ok === false) {
                                throw new Error('Creazione menù fallita');
                            }

                            alert('Menù creato correttamente');
                            navigate('/menu');
                        } catch (e) {
                            console.error('Errore creazione menù:', e);
                            form?.setFieldError?.(
                                'form',
                                e?.message || 'Errore creazione menù',
                            );
                            alert(e?.message || 'Errore creazione menù');
                        }
                    }}
                >
                    <Card className="mt-6">
                        <FormGlobalError />

                        {/* Sezione: Nome */}
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-brand-text">
                                Identificazione
                            </h2>
                            <span className="text-xs text-brand-text/60">
                                Campi obbligatori *
                            </span>
                        </div>

                        <FormGroup label="Nome menù" name="name" required>
                            <Input name="name" asyncValidate />
                        </FormGroup>

                        <AlertBox
                            variant="warning"
                            title="Nome univoco"
                            className="mt-4"
                        >
                            Scegli un nome diverso da altri menù attivi o
                            futuri.
                        </AlertBox>

                        <DashedDivider className="my-6" />

                        {/* Sezione: Date */}
                        <h2 className="text-lg font-semibold text-brand-text mb-3">
                            Intervallo di validità
                        </h2>

                        <FormGroup label="Intervallo date" required>
                            <DateRangePicker
                                startName="start_date"
                                endName="end_date"
                                disablePast
                            />
                        </FormGroup>

                        <AlertBox
                            variant="warning"
                            title="Controllo sovrapposizioni"
                        >
                            Le date scelte non devono sovrapporsi ad altri menù
                            attivi o futuri.
                        </AlertBox>

                        {/* Azioni */}
                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <SubmitButton />
                                <Button
                                    type="button"
                                    variant="underline"
                                    onClick={() => navigate('/menu')}
                                >
                                    Annulla
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Form>
            </div>
        </AppLayout>
    );
}
