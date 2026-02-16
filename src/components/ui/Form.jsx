import { createContext, useContext, useRef, useState } from 'react';

const FormContext = createContext(null);

export function useFormContext() {
    return useContext(FormContext);
}

export default function Form({
    initialValues = {},
    validate = {},
    asyncValidate = {},
    validateForm,

    // Configurazione comportamento
    validateOnBlur = true,
    validateOnSubmit = true,
    validateOnChange = false,

    onSubmit,
    children,
    className = '',
}) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [asyncLoading, setAsyncLoading] = useState({});
    const [asyncSuccess, setAsyncSuccess] = useState({});

    const firstErrorRef = useRef(null);
    const asyncValidationToken = useRef({});

    // ------------------------------------------------------------
    // VALIDAZIONI
    // ------------------------------------------------------------

    const runSyncValidation = (name, value, allValues = values) => {
        if (!validate[name]) return null;
        return validate[name](value, allValues);
    };

    const runAsyncValidationForField = async (name, value) => {
        // Nessuna validazione async configurata
        if (!asyncValidate[name]) return null;

        // Evita chiamate inutili
        if (!value || value.length < 3) {
            setAsyncSuccess((prev) => ({ ...prev, [name]: false }));
            return null;
        }

        // Se c’è errore sync → NON fare async
        const syncErr = runSyncValidation(name, value);
        if (syncErr) {
            setAsyncSuccess((prev) => ({ ...prev, [name]: false }));
            return null;
        }

        // TOKEN
        const token = (asyncValidationToken.current[name] ?? 0) + 1;
        asyncValidationToken.current[name] = token;

        setAsyncLoading((prev) => ({ ...prev, [name]: true }));
        setAsyncSuccess((prev) => ({ ...prev, [name]: false }));

        const result = await asyncValidate[name](value);

        // Risposta vecchia → ignora
        if (asyncValidationToken.current[name] !== token) {
            return null;
        }

        setAsyncLoading((prev) => ({ ...prev, [name]: false }));

        if (result) {
            // errore
            setAsyncSuccess((prev) => ({ ...prev, [name]: false }));
        } else {
            // success
            setAsyncSuccess((prev) => ({ ...prev, [name]: true }));
        }

        return result;
    };

    // ------------------------------------------------------------
    // CAMBIAMENTO CAMPO
    // ------------------------------------------------------------
    const setFieldValue = async (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));

        // Reset success quando si modifica
        setAsyncSuccess((prev) => ({ ...prev, [name]: false }));

        if (validateOnChange) {
            const syncErr = runSyncValidation(name, value);
            setErrors((prev) => ({ ...prev, [name]: syncErr }));

            const asyncErr = await runAsyncValidationForField(name, value);
            setErrors((prev) => ({
                ...prev,
                [name]: asyncErr || syncErr || null,
            }));
        }
    };

    const setFieldError = (name, error) => {
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    // ------------------------------------------------------------
    // REGISTRAZIONE CAMPO
    // ------------------------------------------------------------
    const registerField = (name) => ({
        name,
        value: values[name] ?? '',
        onChange: (e) => setFieldValue(name, e.target.value),
        onBlur: async (e) => {
            setTouched((prev) => ({ ...prev, [name]: true }));

            if (validateOnBlur) {
                const current = e?.target?.value ?? values[name];
                const snapshot = { ...values, [name]: current };

                const syncErr = runSyncValidation(name, current, snapshot);
                setErrors((prev) => ({ ...prev, [name]: syncErr }));

                const asyncErr = await runAsyncValidationForField(
                    name,
                    current,
                );
                setErrors((prev) => ({
                    ...prev,
                    [name]: asyncErr || syncErr || null,
                }));
            }
        },
    });

    // ------------------------------------------------------------
    // SUBMIT FORM
    // ------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateOnSubmit) {
            await onSubmit(values, ctxValue);
            return;
        }

        setSubmitting(true);

        // Segna TUTTI i campi come toccati
        const allTouched = {};
        Object.keys({ ...validate, ...asyncValidate }).forEach((k) => {
            allTouched[k] = true;
        });
        setTouched(allTouched);

        // 1) Validazione sync
        let syncErrors = {};
        for (const field in validate) {
            const err = validate[field](values[field], values);

            if (err) syncErrors[field] = err;
        }

        // 2) Validazione async
        let asyncErrors = {};
        for (const field in asyncValidate) {
            const value = values[field];
            const asyncErr = await runAsyncValidationForField(field, value);
            if (asyncErr) asyncErrors[field] = asyncErr;
        }

        // VALIDAZIONE INCROCIATA (se fornita)
        if (validateForm) {
            const formErrors = validateForm(values);

            if (formErrors && Object.keys(formErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...formErrors }));
                setSubmitting(false);
                return;
            }
        }

        const allErrors = { ...syncErrors, ...asyncErrors };
        setErrors(allErrors);

        // Blocca submit se async è ancora in corso
        if (Object.values(asyncLoading).some((v) => v === true)) {
            setSubmitting(false);
            return;
        }

        // Blocca submit se ci sono errori
        if (Object.keys(allErrors).length > 0) {
            setSubmitting(false);
            return;
        }

        // Submit effettivo
        await onSubmit(values, ctxValue);
        setSubmitting(false);
    };

    // ------------------------------------------------------------
    // VALORI NEL CONTEXT
    // ------------------------------------------------------------
    const ctxValue = {
        values,
        errors,
        touched,
        submitting,

        asyncLoading,
        asyncSuccess,

        registerField,
        setFieldValue,
        setFieldError,
    };

    return (
        <FormContext.Provider value={ctxValue}>
            <form onSubmit={handleSubmit} noValidate className={className}>
                {children}
            </form>
        </FormContext.Provider>
    );
}
