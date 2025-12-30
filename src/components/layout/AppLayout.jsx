import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ title, username, children }) {
    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <Header title={title} username={username} />

            {/* Layout principale */}
            <div className="flex flex-row flex-grow pt-16">
                {/* Sidebar */}
                <Sidebar />

                {/* Contenuto */}
                <main className="ml-[290px] flex-grow px-10 py-8 bg-white overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
