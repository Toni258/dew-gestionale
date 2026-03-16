// Layout app layout.
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ title, children }) {
    return (
        <div className="flex flex-col h-screen">
            {/* Header section */}
            <Header title={title} />

            {/* Layout principale */}
            <div className="flex flex-row flex-grow pt-16">
                {/* Sidebar */}
                <Sidebar />

                {/* Contenuto */}
                <main className="ml-[290px] flex-grow px-10 pt-5 pb-8 bg-white overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}