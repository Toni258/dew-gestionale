import Modal from '../ui/Modal';
import Form from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import DateRangePicker from '../ui/DateRangePicker';
import CustomSelect from '../ui/CustomSelect';
import Button from '../ui/Button';
import { weekDayToDayIndex, dayIndexToWeekDay } from '../../utils/dayIndex';

export default function ModifyMenuModal({ menu, open, onClose, onConfirm }) {
    if (!open || !menu) return null;

    const { settimana, giorno } = dayIndexToWeekDay(menu.day_index);

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8">
                <h2 className="text-brand-text text-2xl font-semibold">
                    Modifica dati del menù
                </h2>

                <Form
                    key={`${menu.season_type}-${menu.start_date}-${menu.end_date}-${menu.day_index}-${open}`}
                    initialValues={{
                        start_date: menu.start_date || '',
                        end_date: menu.end_date || '',
                        settimana,
                        giorno,
                    }}
                    validateOnBlur
                    validateOnSubmit
                    validateForm={(values) => {
                        const errs = {};

                        if (!values.start_date)
                            errs.start_date = 'Obbligatorio';
                        if (!values.end_date) errs.end_date = 'Obbligatorio';
                        if (
                            values.end_date &&
                            values.start_date &&
                            values.end_date < values.start_date
                        ) {
                            errs.end_date =
                                'La data fine deve essere >= data inizio';
                        }

                        if (!values.settimana) errs.settimana = 'Obbligatorio';
                        if (!values.giorno) errs.giorno = 'Obbligatorio';

                        return errs;
                    }}
                    onSubmit={async (values, form) => {
                        const { start_date, end_date, settimana, giorno } =
                            values;

                        const computedDayIndex = weekDayToDayIndex(
                            settimana,
                            giorno,
                        );
                        if (computedDayIndex === null) {
                            form.setFieldError('giorno', 'Valore non valido');
                            form.setFieldError(
                                'settimana',
                                'Valore non valido',
                            );
                            return;
                        }

                        // 1) overlap check (ESCLUDI il menu corrente)
                        const overlapRes = await fetch(
                            `/api/menus/dates-overlap?start_date=${encodeURIComponent(
                                start_date,
                            )}&end_date=${encodeURIComponent(
                                end_date,
                            )}&excludeName=${encodeURIComponent(
                                menu.season_type,
                            )}`,
                        );

                        if (!overlapRes.ok) {
                            form.setFieldError(
                                'start_date',
                                'Impossibile verificare overlap',
                            );
                            return;
                        }

                        const overlapData = await overlapRes.json();

                        if (overlapData.overlap) {
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

                        // 2) payload update
                        const payload = {
                            start_date,
                            end_date,
                            day_index: computedDayIndex,
                        };

                        // 3) delega al parent l'API call (così gestisci UI/stato da EditMenu)
                        await onConfirm(payload);
                    }}
                >
                    <div className="w-[650px]">
                        <FormGroup
                            label="Intervallo date"
                            className="mt-6"
                            required
                        >
                            <div className="flex flex-col">
                                <DateRangePicker
                                    startName="start_date"
                                    endName="end_date"
                                    disablePast
                                />
                                <div className="flex items-center gap-4 px-6">
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
                        </FormGroup>

                        {/* Divider tratteggiato */}
                        <div className="mt-6 mb-6 h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                        <div className="flex">
                            <div className="flex-[1]">
                                <span className="text-xl">Giorno del menù</span>
                                <div className="flex items-center gap-3 mt-4">
                                    <span className="flex-[2]">Giorno</span>
                                    <CustomSelect
                                        name="giorno"
                                        options={[
                                            { value: '1', label: '1' },
                                            { value: '2', label: '2' },
                                            { value: '3', label: '3' },
                                            { value: '4', label: '4' },
                                            { value: '5', label: '5' },
                                            { value: '6', label: '6' },
                                            { value: '7', label: '7' },
                                        ]}
                                        className="flex-[1]" // [&>div>button]:rounded-full
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex-[2]">Settimana</span>
                                    <CustomSelect
                                        name="settimana"
                                        options={[
                                            { value: '1', label: '1' },
                                            { value: '2', label: '2' },
                                            { value: '3', label: '3' },
                                            { value: '4', label: '4' },
                                        ]}
                                        className="flex-[1]" // [&>div>button]:rounded-full
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col flex-[2] gap-3">
                                <div className="flex gap-4 px-6">
                                    <img
                                        src="/information nero primary.png"
                                        className="w-5 h-5 mt-1"
                                        alt="Informazione"
                                    />
                                    <h2 className="text-brand-textSecondary">
                                        Indica il giorno corrente del menù a 28
                                        giorni. Se il menù è attivo, mostra
                                        quale giorno del ciclo è in uso oggi. Se
                                        il menù è futuro, indica da quale giorno
                                        inizierà il ciclo quando il menù entrerà
                                        in vigore.
                                    </h2>
                                </div>
                                <div className="flex gap-4 px-6">
                                    <img
                                        src="/warning giallo.png"
                                        className="w-5 h-5 mt-1"
                                        alt="Avvertenza"
                                    />
                                    <h2 className="text-brand-textSecondary">
                                        Assicurati di aver composto tutti i
                                        pasti del menù attivo
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-8 justify-center mt-10">
                            <Button
                                type="button"
                                size="md"
                                variant="secondary"
                                className="px-6 py-2 rounded-xl"
                                onClick={onClose}
                            >
                                Annulla
                            </Button>
                            <Button
                                type="submit"
                                size="md"
                                variant="primary"
                                className="px-6 py-2 rounded-xl"
                            >
                                Salva madifiche
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>
        </Modal>
    );
}
