// Layout app layout.
import { useCallback, useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const DESKTOP_BREAKPOINT = 1280;

export default function AppLayout({ title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((current) => !current);
    }, []);

    useEffect(() => {
        function syncSidebarWithViewport() {
            if (window.innerWidth >= DESKTOP_BREAKPOINT) {
                setSidebarOpen(false);
            }
        }

        syncSidebarWithViewport();
        window.addEventListener('resize', syncSidebarWithViewport);

        return () => {
            window.removeEventListener('resize', syncSidebarWithViewport);
        };
    }, []);

    useEffect(() => {
        const isMobileViewport = window.innerWidth < DESKTOP_BREAKPOINT;

        if (!isMobileViewport || !sidebarOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header
                title={title}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={toggleSidebar}
            />

            <div className="flex flex-1 pt-16">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={closeSidebar}
                />

                <main className="min-w-0 flex-1 overflow-y-auto bg-white px-4 pb-8 pt-5 sm:px-6 lg:px-8 xl:ml-[290px] xl:px-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
