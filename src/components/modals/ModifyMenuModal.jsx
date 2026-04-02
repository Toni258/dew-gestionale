import Modal from '../ui/Modal';
import Form from '../ui/Form';
import FormGroup from '../ui/FormGroup';
import DateRangePicker from '../ui/DateRangePicker';
import CustomSelect from '../ui/CustomSelect';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';
import { weekDayToDayIndex, dayIndexToWeekDay } from '../../utils/dayIndex';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import { checkMenuDatesOverlap } from '../../services/menusApi';

export default function ModifyMenuModal({ menu, open, onClose, onConfirm }) {
    if (!open || !menu) return null;

    const { settimana, giorno } = dayIndexToWeekDay(menu.day_index);

    return (
        <Modal onClose={onClose} contentClassName="w-[760px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 min-w-[760px] flex flex-col">
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text text-2xl font-semibold">
                        Modifica dati del menù
                    </span>

                    <span className="text-lg font-semibold">
                        Menù:{' '}
                        <span className="text-brand-primary">
                            {menu.season_type}
                        </span>
                    </span>
                </div>

                <Form
                    className="mt-6"
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

                        const overlapRes = await withLoaderNotify({
                            message: 'Verifica sovrapposizioni…',
                            mode: 'blocking',
                            errorTitle: 'Errore verifica',
                            errorMessage:
                                'Impossibile verificare le sovrapposizioni.',
                            fn: async () => {
                                return checkMenuDatesOverlap(
                                    start_date,
                                    end_date,
                                    {
                                        excludeName: menu.season_type,
                                    },
                                );
                            },
                        });

                        if (!overlapRes.ok) {
                            form.setFieldError(
                                'start_date',
                                'Impossibile verificare overlap',
                            );
                            return;
                        }

                        const overlapData = overlapRes.data;

                        if (overlapData?.overlap) {
                            const isArchivedConflict =
                                overlapData.source === 'arch_menu';

                            form.setFieldError(
                                'start_date',
                                isArchivedConflict
                                    ? 'Intervallo in conflitto con un menù archiviato'
                                    : 'Intervallo date già in uso',
                            );

                            function fmt(d) {
                                return d.split('-').reverse().join('/');
                            }

                            form.setFieldError(
                                'end_date',
                                isArchivedConflict
                                    ? `Conflitto con il menù archiviato "${overlapData.season_type}" (${fmt(overlapData.start_date)} - ${fmt(overlapData.end_date)})`
                                    : `Intervallo già usato nel menù "${overlapData.season_type}" (${fmt(overlapData.start_date)} - ${fmt(overlapData.end_date)})`,
                            );
                            return;
                        }

                        const payload = {
                            start_date,
                            end_date,
                            day_index: computedDayIndex,
                        };

                        await onConfirm(payload);
                    }}
                >
                    <FormGroup label="Intervallo date" required>
                        <div className="flex flex-col">
                            <DateRangePicker
                                startName="start_date"
                                endName="end_date"
                            />

                            <div className="w-full flex justify-center mt-4">
                                <AlertBox
                                    variant="warning"
                                    title="Attenzione"
                                    className="w-[92%]"
                                >
                                    Le date di inizio e fine del menù corrente
                                    non si devono sovrapporre con le date di
                                    altri menù attivi o futuri.
                                </AlertBox>
                            </div>
                        </div>
                    </FormGroup>

                    <div className="w-full flex justify-center mt-6 mb-4">
                        <div className="w-[95%]">
                            <div className="h-[1px] w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_10px,transparent_10px,transparent_18px)]" />
                        </div>
                    </div>

                    <div className="flex gap-12">
                        <div className="flex-1">
                            <span className="text-xl font-medium">
                                Giorno del menù
                            </span>

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
                                    className="flex-[1] [&>div>button]:rounded-lg"
                                    height="h-[45px]"
                                />
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                                <span className="flex-[2]">Settimana</span>
                                <CustomSelect
                                    name="settimana"
                                    options={[
                                        { value: '1', label: '1' },
                                        { value: '2', label: '2' },
                                        { value: '3', label: '3' },
                                        { value: '4', label: '4' },
                                    ]}
                                    className="flex-[1] [&>div>button]:rounded-lg"
                                    height="h-[45px]"
                                />
                            </div>
                        </div>

                        <div className="flex-[1.4] flex flex-col gap-4">
                            <AlertBox variant="info" title="Informazione">
                                Indica il giorno corrente del menù a 28 giorni.
                                Se il menù è attivo, mostra quale giorno del
                                ciclo è in uso oggi. Se il menù è futuro, indica
                                da quale giorno inizierà il ciclo quando il menù
                                entrerà in vigore.
                            </AlertBox>
                        </div>
                    </div>

                    <div className="flex mt-8 gap-6">
                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="rounded-lg"
                        >
                            Salva modifiche
                        </Button>

                        <Button
                            type="button"
                            size="md"
                            variant="secondary"
                            className="rounded-lg"
                            onClick={onClose}
                        >
                            Annulla
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
}
