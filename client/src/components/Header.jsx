
import { Search, Bell, Moon, Languages } from 'lucide-react';

const Header = () => {
    return (
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
            </div>

            <div className="flex flex-1 items-center justify-center px-6">
                <div className="relative w-full max-w-xl">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search positions, CVs, discussions..."
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <Bell className="h-5 w-5" />
                </button>

                <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <Moon className="h-5 w-5" />
                </button>

                <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <Languages className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                        SM
                    </div>

                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-slate-900">
                            Sumaiya
                        </p>
                        <p className="text-xs text-slate-500">
                            Candidate
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;