import { useFormContext } from "./Form";

export default function CustomSelect({
    name,
    options = [],
    className = "",
    ...props
}) {
    const form = useFormContext();

    // FALLBACK: Select normale senza form
    if (!form || !name) {
        return (
            <select
                className={`input-default cursor-pointer 
                            appearance-none 
                            bg-[url('/chevron-down-primary.png')] 
                            bg-no-repeat 
                            bg-[length:16px_16px]
                            bg-[position:calc(100%-12px)_center]
                            pr-10
                            ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    // Integrato con form
    const field = form.registerField(name);
    const error = form.errors[name];

    return (
        <div className={`flex flex-col ${className}`}>
            <select
                {...field}
                {...props}
                className={`input-default cursor-pointer appearance-none 
                            bg-[url('/chevron-down-primary.png')] 
                            bg-no-repeat 
                            bg-[length:16px_16px]
                            bg-[position:calc(100%-12px)_center]
                            pr-10
                            ${error ? "border-brand-error" : "border-brand-divider"}
                            ${className}`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {error && (
                <span className="text-brand-error text-sm mt-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
}
