
import React from 'react';
import { AppConnection, AppSource } from '../types';

interface SidebarProps {
  username: string;
  connections: AppConnection[];
  onConnect: (id: AppSource) => void;
  onBrowse: (id: AppSource) => void;
  onLogout: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ username, connections, onConnect, onBrowse, onLogout, isOpen }) => {
  return (
    <div 
      className={`fixed top-16 bottom-0 left-0 w-72 glass border-r border-white/5 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Top: Admin Profile */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-full border border-lime-500/30 overflow-hidden flex-shrink-0">
            <img src={`https://picsum.photos/seed/${username}/100`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{username}</p>
            <p className="text-[10px] text-lime-400 font-medium uppercase tracking-wider">Administrator</p>
          </div>
        </div>
      </div>

      {/* Middle: Main Options */}
      <div className="flex-1 p-4 flex flex-col space-y-2 overflow-y-auto">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Connectors</h2>
        {connections.map((app) => (
          <div key={app.id} className="group">
            {!app.connected ? (
              <button 
                onClick={() => onConnect(app.id)}
                disabled={app.loading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-lime-500/30 hover:bg-zinc-800/50 transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-lime-400 transition-colors">
                    {app.id === 'gmail' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    {app.id === 'gdrive' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                    {app.id === 'dropbox' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{app.name}</span>
                </div>
                {app.loading ? (
                  <svg className="animate-spin h-3 w-3 text-lime-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                )}
              </button>
            ) : (
              <button 
                onClick={() => onBrowse(app.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-lime-500/5 border border-lime-500/20 hover:bg-lime-500/10 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-lime-500/10 rounded-lg text-lime-400">
                    {app.id === 'gmail' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    {app.id === 'gdrive' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                    {app.id === 'dropbox' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                  </div>
                  <span className="text-sm font-medium text-white">{app.name}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></div>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom: Logout */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-900/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
