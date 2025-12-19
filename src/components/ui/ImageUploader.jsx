import { useRef, useMemo, useEffect, useState } from 'react';
import { useFormContext } from './Form';

export default function ImageUploader({ name, disabled = false }) {
    const inputRef = useRef(null);
    const form = useFormContext();
    const [isDragOver, setIsDragOver] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (!form) {
        throw new Error('ImageUploader deve essere usato dentro <Form>');
    }

    const value = form.values[name];

    useEffect(() => {
        setImageError(false);
    }, [value]);

    const previewUrl = useMemo(() => {
        if (!value || imageError) return null;
        if (typeof value === 'string') return value;
        if (value instanceof File) return URL.createObjectURL(value);
        return null;
    }, [value, imageError]);

    useEffect(() => {
        if (value instanceof File && previewUrl) {
            return () => URL.revokeObjectURL(previewUrl);
        }
    }, [value, previewUrl]);

    const setFile = (file) => {
        if (!file || disabled) return;
        if (!file.type.startsWith('image/')) return;

        form.setFieldValue(name, file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) setFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) setFile(file);
    };

    const borderClass = disabled
        ? 'border-brand-divider opacity-60 cursor-not-allowed'
        : isDragOver
        ? 'border-brand-primary'
        : 'border-black hover:border-brand-primary';

    return (
        <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative w-full max-w-[318px] aspect-[318/206] cursor-pointer"
        >
            {/* 1️⃣ BACKGROUND + SHADOW */}
            <div className="absolute inset-0 rounded-md bg-white shadow-[0_0_30px_rgba(0,0,0,0.25)]" />

            {/* SVG BORDER */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 318 206"
                preserveAspectRatio="none"
            >
                <rect
                    x="0.5"
                    y="0.5"
                    width="317"
                    height="205"
                    rx="8"
                    ry="8"
                    fill="none"
                    stroke={
                        disabled
                            ? 'var(--brand-divider)'
                            : isDragOver
                            ? '#22c55e' // verde (tailwind green-500)
                            : 'black'
                    }
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={isDragOver ? 2 : 1}
                    strokeDasharray={isDragOver ? 5 : 10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {/* CONTENT */}
            <div className="relative z-10 w-full h-full flex items-center justify-center rounded-md pointer-events-none">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Anteprima piatto"
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 select-none">
                        <img
                            src="/add_photo_alternate_rounded.png"
                            alt="Carica foto"
                            className="w-12 h-12"
                            draggable={false}
                        />
                        <span className="text-base font-normal text-brand-text">
                            Carica Foto
                        </span>
                        {isDragOver && (
                            <span className="text-xs text-brand-textSecondary">
                                Rilascia qui l’immagine
                            </span>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                disabled={disabled}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
