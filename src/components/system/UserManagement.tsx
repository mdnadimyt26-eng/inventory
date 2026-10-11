import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Users, Edit3, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const { users, setUsers, currentUser, t } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [userPhone, setUserPhone] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userName,
      email: userEmail,
      role: userRole,
      phone: userPhone,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces`,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    setShowAddModal(false);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
  };

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    if (userId === currentUser.id && newRole !== 'admin') {
      alert('You cannot demote yourself from Administrator role.');
      return;
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (confirm('Are you sure you want to remove this user from the system?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            {t.userManagement} & Role Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Role-Based Access Control (RBAC): Admin, Manager, and Staff roles
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff User</span>
        </button>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src={u.avatar} 
                  alt={u.name} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200" 
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    {u.name}
                    {u.id === currentUser.id && (
                      <span className="text-[10px] bg-indigo-50 text-[#4F35F5] px-1.5 py-0.2 rounded font-bold">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">{u.email}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">System Role:</span>
                  <select 
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold capitalize text-slate-800 outline-none"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="manager">Manager (Sales & Inventory)</option>
                    <option value="staff">Staff (Sales Entry Only)</option>
                  </select>
                </div>
                {u.phone && (
                  <p className="text-slate-500">Phone: <span className="text-slate-800 font-mono">{u.phone}</span></p>
                )}
                <p className="text-[10px] text-slate-400">Registered: {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                u.role === 'manager' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {u.role}
              </span>

              {u.id !== currentUser.id && (
                <button 
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Remove User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#4F35F5]" />
              Add Authorized Staff Member
            </h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Mahfuz Rahman"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="mahfuz@giftcity.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Role</label>
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                >
                  <option value="staff">Staff (Sales Entry & Invoicing)</option>
                  <option value="manager">Manager (Inventory & Finance)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+880 17XXXXXXXX"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#4F35F5]/30 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4F35F5] hover:bg-indigo-600 rounded-xl shadow-xs"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
