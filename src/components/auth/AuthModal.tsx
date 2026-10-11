import React, { useState } from 'react';
import { X, Lock, ShieldCheck, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, setCurrentUser, settings } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      setCurrentUser(found);
      onClose();
    } else {
      setAuthError('No active user found with this email. Select one of the verified demo accounts below.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#10192F] p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img 
                src={settings.logo} 
                alt={settings.companyName || "Gift City"} 
                className="h-10 max-w-[100px] object-contain shrink-0"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F35F5] to-indigo-400 flex items-center justify-center text-white">
                <Lock className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">{settings.companyName || 'Gift City'} Authentication</h3>
              <p className="text-xs text-slate-400">Select active role or sign in with credentials</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick Switch Profiles */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Instant Role Switching (Pre-configured)
            </h4>
            <div className="space-y-2">
              {users.map(u => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent 
                        ? 'border-[#4F35F5] bg-indigo-50/40 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'manager' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#4F35F5]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Login Form */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Or Sign In with Email
            </h4>

            {authError && (
              <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {authError}
              </p>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@giftcity.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-colors"
              >
                Authenticate Session
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
