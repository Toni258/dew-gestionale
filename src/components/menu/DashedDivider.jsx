export default function DashedDivider({ className = '' }) {
    return (
        <div
            className={`h-px w-full bg-[repeating-linear-gradient(to_right,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)] ${className}`}
        />
    );
}
