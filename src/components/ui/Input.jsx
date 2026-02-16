import { useFormContext } from './Form';
import { useMemo, useState } from 'react';

export default function Input({
    name,
    className = '',
    asyncValidate = false,
    ...props
}) {
    const form = useFormContext();

    // Stato toggle password (solo per type=password)
    const isPasswordField = props.type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    // Nessun form: input standalone
    if (!form || !name) {
        const standaloneType = isPasswordField
            ? showPassword
                ? 'text'
                : 'password'
            : props.type;

        return (
            <div className={`flex flex-col ${className}`}>
                <div className="relative h-[38px]">
                    <input
                        {...props}
                        type={standaloneType}
                        className={`input-default w-full pr-10 h-full border border-brand-divider`}
                    />

                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-textSecondary hover:text-brand-text transition"
                            aria-label={
                                showPassword
                                    ? 'Nascondi password'
                                    : 'Mostra password'
                            }
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    )}
                </div>
            </div>
        );
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

    // Decidiamo quante "icone" ci sono a destra per dare padding giusto
    const rightIconsCount = useMemo(() => {
        let c = 0;
        if (shouldShowSpinner || shouldShowSuccess) c += 1;
        if (isPasswordField) c += 1;
        return c;
    }, [shouldShowSpinner, shouldShowSuccess, isPasswordField]);

    const rightPaddingClass =
        rightIconsCount >= 2
            ? 'pr-16'
            : rightIconsCount === 1
              ? 'pr-10'
              : 'pr-3';

    // --- handler combinati ---
    const handleFocus = (e) => {
        if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = async (e) => {
        if (field.onBlur) {
            await field.onBlur(e);
        }
        if (props.onBlur) props.onBlur(e);
    };

    // Tipo finale
    const inputType = isPasswordField
        ? showPassword
            ? 'text'
            : 'password'
        : props.type;

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="relative h-[38px]">
                <input
                    {...field}
                    {...props}
                    type={inputType}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`input-default w-full h-full ${rightPaddingClass} ${
                        error ? 'border-brand-error' : 'border-brand-divider'
                    }`}
                />

                {/* Spinner async / Success: lo mettiamo "più a sinistra" se c'è anche l'occhio */}
                {(shouldShowSpinner || shouldShowSuccess) && (
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 ${
                            isPasswordField ? 'right-10' : 'right-2'
                        }`}
                    >
                        {shouldShowSpinner && (
                            <span className="block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        )}

                        {shouldShowSuccess && (
                            <span className="text-green-600 text-lg">✔</span>
                        )}
                    </div>
                )}

                {/* Toggle visibilità password */}
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-textSecondary hover:text-brand-text transition"
                        aria-label={
                            showPassword
                                ? 'Nascondi password'
                                : 'Mostra password'
                        }
                    >
                        <img
                            src={
                                showPassword
                                    ? '/eye open.png'
                                    : '/eye closed.png'
                            }
                            className="w-5 h-5"
                            alt=""
                        />
                    </button>
                )}
            </div>
        </div>
    );
}
