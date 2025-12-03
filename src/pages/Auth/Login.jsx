import { useState } from 'react';
import Input from '../../components/ui/Input';
import ForgotPasswordModal from './ForgotPasswordModal';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';

export default function Login() {
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [animateOut, setAnimateOut] = useState(false);

    // Passaggio LOGIN → MODAL
    function openForgotPassword() {
        setAnimateOut(true);
        setTimeout(() => {
            setShowForgot(true);
            setAnimateOut(false);
        }, 200); // durata della fade-out
    }

    // Passaggio MODAL → LOGIN
    function closeForgotPassword() {
        setAnimateOut(true);
        setTimeout(() => {
            setShowForgot(false);
            setAnimateOut(false);
        }, 200);
    }

    return (
        <div className="bg-brand-background h-screen flex items-center justify-center">
            {/* POPUP LOGIN */}
            {!showForgotPassword && (
                <Card
                    className={`flex flex-col items-center ${
                        animateOut ? 'fade-out' : 'modal-animation'
                    }`}
                >
                    {/* Logo + titolo */}
                    <div className="flex flex-row items-center">
                        <img
                            src="/Do Eat Well Logo Verde.png"
                            alt="logo"
                            className="w-[85px] h-[85px]"
                        />
                        <h1 className="text-3xl font-bold text-brand-primary">
                            DoEatWell Manager
                        </h1>
                    </div>

                    {/* FORM */}
                    <Input
                        placeholder="Inserisci la tua email"
                        className="mt-10 mb-2 w-[85%]"
                        type="email"
                    />
                    <Input
                        placeholder="Inserisci la tua password"
                        className="mt-2 mb-8 w-[85%]"
                        type="password"
                    />

                    {/* Link: password dimenticata */}
                    <div className="w-[85%] flex justify-end mb-2">
                        <button
                            className="text-brand-textSecondary text-sm hover:underline"
                            onClick={() => setShowForgotPassword(true)}
                        >
                            Password dimenticata?
                        </button>
                    </div>

                    <Button variant="primary" size="md" className="w-[85%]">
                        Accedi
                    </Button>
                </Card>
            )}

            {/* MODALE RECUPERO PASSWORD */}
            {showForgotPassword && (
                <ForgotPasswordModal
                    onClose={() => setShowForgotPassword(false)}
                />
            )}
        </div>
    );
}
