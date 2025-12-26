import { useFormContext } from './Form';
import { useState } from 'react';

export default function Input({
    name,
    className = '',
    asyncValidate = false,
    ...props
}) {
    const form = useFormContext();

    // Nessun form: input standalone
    if (!form || !name) {
        return <input className={`input-default ${className}`} {...props} />;
    }

    const field = form.registerField(name);

    const showError = form.touched[name] || form.submitting;
    const error = showError ? form.errors[name] : null;

    const loading = form.asyncLoading?.[name];
    const success = form.asyncSuccess?.[name];
    const value = form.values[name];

    const shouldShowSpinner =
        asyncValidate && loading && !error && value && value.length >= 3;

    const shouldShowSuccess =
        asyncValidate &&
        success &&
        !loading &&
        !error &&
        value &&
        value.length >= 3;

    const [showTooltip, setShowTooltip] = useState(false);

    // --- handler combinati ---
    const handleFocus = (e) => {
        // Se vuoi mostrare il tooltip solo in caso di errore
        if (error) setShowTooltip(true);
        // se in futuro passi onFocus da props, puoi chiamarlo qui
        if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = async (e) => {
        // IMPORTANTISSIMO: chiamare l'onBlur del form
        if (field.onBlur) {
            await field.onBlur(e);
        }

        setShowTooltip(false);

        if (props.onBlur) props.onBlur(e);
    };

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="relative h-[38px]">
                <input
                    {...field}
                    {...props}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`input-default w-full pr-10 h-full ${
                        error ? 'border-brand-error' : 'border-brand-divider'
                    }`}
                />

                {/* Spinner async */}
                {shouldShowSpinner && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className="block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Check di successo */}
                {shouldShowSuccess && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 text-lg pointer-events-none">
                        ✔
                    </div>
                )}
            </div>
        </div>
    );
}
