import { createContext, useContext, useEffect, useRef, useState } from 'react';

const FormContext = createContext(null);

export function useFormContext() {
    return useContext(FormContext);
}

export default function Form({
    initialValues = {},
    validate = {},
    asyncValidate = {},
    onSubmit,
    children,
    className = '',
}) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const firstErrorRef = useRef(null);

    // ------------------------------------------------------------
    // SETTERS
    // ------------------------------------------------------------

    const setFieldValue = (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));

        /*
        if (validate[name]) {
            const err = validate[name](value);
            setErrors((prev) => ({ ...prev, [name]: err }));
        }
        */
    };

    const setFieldError = (name, error) => {
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const registerField = (name) => ({
        name,
        value: values[name] ?? '',
        onChange: (e) => setFieldValue(name, e.target.value),
        onBlur: () => {
            setTouched((prev) => ({ ...prev, [name]: true }));

            if (validate[name]) {
                const err = validate[name](values[name]);
                setErrors((prev) => ({ ...prev, [name]: err }));
            }
        },
    });

    // ------------------------------------------------------------
    // ASYNC VALIDATION
    // ------------------------------------------------------------

    const runAsyncValidation = async () => {
        let asyncErrors = {};

        for (const fieldName in asyncValidate) {
            const validator = asyncValidate[fieldName];
            const res = await validator(values[fieldName]);

            if (res) {
                asyncErrors[fieldName] = res;
            }
        }

        return asyncErrors;
    };

    // ------------------------------------------------------------
    // SUBMIT HANDLER
    // ------------------------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // 1. Validazione sincrona
        let syncErrors = {};

        for (const field in validate) {
            const err = validate[field](values[field]);
            if (err) syncErrors[field] = err;
        }

        // 2. Validazione asincrona
        const asyncErrors = await runAsyncValidation();

        const allErrors = { ...syncErrors, ...asyncErrors };
        setErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {
            // Focus sul primo errore
            firstErrorRef.current?.scrollIntoView({ behavior: 'smooth' });
            setSubmitting(false);
            return;
        }

        // 3. Submit finale
        await onSubmit(values);

        setSubmitting(false);
    };

    const value = {
        values,
        errors,
        touched,
        submitting,
        registerField,
        setFieldValue,
        setFieldError,
    };

    return (
        <FormContext.Provider value={value}>
            <form onSubmit={handleSubmit} noValidate className={className}>
                {children}
            </form>
        </FormContext.Provider>
    );
}
