import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ForgotPasswordModal({ onClose }) {
    return (
        <Card className="w-[420px] modal-animation">
            <h2 className="text-2xl font-bold mb-4 text-brand-primary">
                Recupero password
            </h2>

            <p className="text-sm text-brand-textSecondary mb-4">
                Inserisci la tua email e riceverai un link per reimpostare la
                password.
            </p>

            <Input
                label="Email"
                placeholder="Inserisci la tua email"
                className="w-full mb-4"
            />

            <div className="flex justify-end gap-2 mt-2">
                <Button variant="underline" onClick={onClose}>
                    Annulla
                </Button>
                <Button variant="primary" size="md" className="rounded-[8px]">
                    Invia email
                </Button>
            </div>
        </Card>
    );
}
