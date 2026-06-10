import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md">
        {/* TopAppBar */}
        <header className="fixed top-0 w-full z-50 bg-surface/40 dark:bg-surface/40 backdrop-blur-xl border-b border-white/10">
          <div className="flex justify-between items-center px-lg py-md w-full max-w-container-max mx-auto">
            <Link to="/" className="flex items-center gap-sm hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyKmVE9_jxdgHEooMUhAwe2Afqqo4xMxibAJcdf0d09wGOM2dWf7NcVGkVMyDErZDkECKnv5lQnK41-WnRoPh11XBHmXx47Og3e9rdEvl_GCXcrGRiTucrzvxCHUuvFn7vf7HOMToFxOt4JvG5t-vL51g85U2s70zNcVihl8gohOlqL5jxjVxbisdHsrSAyYqboAcYt7W0TzQQOv7OdG_1j7YSTLL8H0AfYGivqCDClqkFSJDYT1NQIWK8WK9Uy3ptXo4XXS6KnQ"
                />
              </div>
              <span className="font-headline-sm text-primary dark:text-primary tracking-tight">Vocalis AI</span>
            </Link>
            <button className="material-symbols-outlined text-on-surface-variant hover:bg-white/5 transition-colors p-sm rounded-full active:scale-95 duration-200">
              notifications
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pt-20 pb-32 max-w-container-max w-full mx-auto px-md overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meeting/:id" element={<MeetingRoom />} />
            <Route path="/meeting/new" element={<MeetingRoom isNew />} />
          </Routes>
        </main>

        {/* BottomNavBar */}
        <nav className="fixed bottom-0 w-full z-50 bg-surface-container/60 dark:bg-surface-container/60 backdrop-blur-lg border-t border-white/10 shadow-2xl">
          <div className="flex justify-around items-center h-20 px-md pb-safe">
            {/* Home (Active) */}
            <Link 
              to="/" 
              className="flex flex-col items-center justify-center text-primary-container bg-primary/10 rounded-xl px-md py-xs transition-all active:scale-90 duration-300"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="font-label-md text-label-md mt-1">Home</span>
            </Link>
            {/* History */}
            <Link 
              to="/" 
              className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-300"
            >
              <span className="material-symbols-outlined">history</span>
              <span className="font-label-md text-label-md mt-1">History</span>
            </Link>
            {/* Analytics */}
            <Link 
              to="/" 
              className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-300"
            >
              <span className="material-symbols-outlined">insights</span>
              <span className="font-label-md text-label-md mt-1">Analytics</span>
            </Link>
            {/* Settings */}
            <Link 
              to="/" 
              className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-300"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label-md text-label-md mt-1">Settings</span>
            </Link>
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;

