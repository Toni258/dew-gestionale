import { useFormContext } from './Form';
import { useMemo, useState } from 'react';

export default function Input({
    name,
    className = '',
    asyncValidate = false,
    ...props
}) {
    const form = useFormContext();

    const isPasswordField = props.type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    // Se c'è il form e c'è name, usiamo il field del form; altrimenti standalone
    const field = form && name ? form.registerField(name) : null;

    // --- error handling (solo se form) ---
    const showError =
        form && name ? form.touched[name] || form.submitting : false;
    const error = showError ? form.errors?.[name] : null;

    // --- async state (solo se form) ---
    const loading = form && name ? form.asyncLoading?.[name] : false;
    const success = form && name ? form.asyncSuccess?.[name] : false;
    const value = form && name ? form.values?.[name] : (props.value ?? '');

    const shouldShowSpinner =
        asyncValidate &&
        !!loading &&
        !error &&
        value &&
        String(value).length >= 3;

    const shouldShowSuccess =
        asyncValidate &&
        !!success &&
        !loading &&
        !error &&
        value &&
        String(value).length >= 3;

    // padding a destra in base al numero di “icone”
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

    // tipo finale (password toggle)
    const inputType = isPasswordField
        ? showPassword
            ? 'text'
            : 'password'
        : props.type;

    // handler combinati (se form)
    const handleFocus = (e) => {
        props.onFocus?.(e);
    };

    const handleBlur = async (e) => {
        if (field?.onBlur) await field.onBlur(e);
        props.onBlur?.(e);
    };

    // props input: se field esiste, lo spalmiamo; altrimenti no
    const inputProps = field
        ? { ...field, ...props, onFocus: handleFocus, onBlur: handleBlur }
        : { ...props };

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="relative h-[38px]">
                <input
                    {...inputProps}
                    type={inputType}
                    className={`input-default w-full h-full ${rightPaddingClass} ${
                        error ? 'border-brand-error' : 'border-brand-divider'
                    }`}
                />

                {/* Spinner / Success */}
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

                {/* Toggle password: SEMPRE immagini (niente emoji) */}
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
                        tabIndex={0}
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
