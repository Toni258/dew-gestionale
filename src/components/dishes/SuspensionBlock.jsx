// Suspension block.
import { useState } from 'react';
import { useFormContext } from '../ui/Form';
import Card from '../ui/Card';
import FormGroup from '../ui/FormGroup';
import DatePicker from '../ui/DatePicker';
import TextArea from '../ui/TextArea';

export default function SuspensionBlock({ initialSuspension }) {
    const form = useFormContext();
    const enabled = !!form.values.suspension_enabled;
    const [showUnsuspendHint, setShowUnsuspendHint] = useState(false);

    return (
        <>
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
                <h2 className="text-3xl font-semibold">Sospensione piatto</h2>

                <button
                    type="button"
                    onClick={() => {
                        const nextEnabled = !enabled;
                        form.setFieldValue('suspension_enabled', nextEnabled);

                        const hadBefore = !!initialSuspension?.enabled;
                        if (!nextEnabled && hadBefore)
                            setShowUnsuspendHint(true);
                        else setShowUnsuspendHint(false);

                        if (enabled) {
                            form.setFieldValue('start_date', '');
                            form.setFieldValue('end_date', '');
                            form.setFieldValue('reason', '');
                        }
                    }}
                    className={`
                        mt-2 relative w-12 h-7 rounded-full transition-colors
                        ${enabled ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                >
                    <span
                        className={`
                            absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                            ${enabled ? 'translate-x-5' : ''}
                        `}
                    />
                </button>
            </div>

            {showUnsuspendHint && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm">
                    La sospensione verrà chiusa alla data odierna
                </div>
            )}

            <Card className="mt-4 relative overflow-visible">
                {!enabled && (
                    <div className="absolute inset-0 z-10 bg-gray-200/70 rounded-xl" />
                )}

                <div className="relative z-5 flex flex-col gap-6 lg:flex-row">
                    <div className="flex w-full flex-col gap-4 lg:w-1/4 xl:w-1/6">
                        <FormGroup label="Data inizio" required={enabled}>
                            <DatePicker name="start_date" disabled={!enabled} />
                        </FormGroup>
                        <FormGroup label="Data fine" required={enabled}>
                            <DatePicker name="end_date" disabled={!enabled} />
                        </FormGroup>
                    </div>

                    <div className="w-full lg:w-3/4 xl:w-5/6">
                        <FormGroup label="Motivo">
                            <TextArea
                                name="reason"
                                placeholder="Motivo della sospensione del piatto (consigliato)"
                                rows={5}
                                disabled={!enabled}
                            />
                        </FormGroup>
                    </div>
                </div>
            </Card>
        </>
    );
}
