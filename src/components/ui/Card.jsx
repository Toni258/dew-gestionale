export default function Card({ children, className = '' }) {
    return (
        <div
            className={`bg-brand-card rounded-xl shadow-card p-6 ${className}`}
        >
            {children}
        </div>
    );
}
