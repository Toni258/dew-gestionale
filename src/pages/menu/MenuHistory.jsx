import AppLayout from '../../components/layout/AppLayout';

export default function MenuHistory() {
    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Menu Archiviati</h1>
            <p>Elenco dei menù archiviati.</p>
        </AppLayout>
    );
}
