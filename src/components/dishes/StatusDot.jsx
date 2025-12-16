export default function StatusDot({ status }) {
    const color =
        status === 'attivo'
            ? 'bg-green-500'
            : status === 'sospeso'
            ? 'bg-yellow-400'
            : 'bg-red-500';

    return <span className={`w-3 h-3 rounded-full inline-block ${color}`} />;
}
