// Reusable card component used for card.
export default function Card({ children, className = '' }) {
    return (
        <div
            className={`bg-brand-card rounded-xl border border-black/5 shadow-card p-6 ${className}`}
        >
            {children}
        </div>
    );
}