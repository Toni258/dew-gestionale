import { useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';

export default function EditDish() {
    const { dishId } = useParams();

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Modifica del piatto</h1>
            <p>Form di modifica del piatto {dishId}</p>
        </AppLayout>
    );
}
