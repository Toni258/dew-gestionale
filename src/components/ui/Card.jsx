export default function Card({ children, className = '' }) {
    return (
        <div
            className={`bg-brand-card rounded-20 shadow-card p-8 ${className}`}
        >
            {children}
        </div>
    );
}
