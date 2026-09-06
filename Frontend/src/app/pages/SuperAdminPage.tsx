import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Users,
  LogOut,
  Bell,
} from 'lucide-react';
import { apiFetch, removeAuthToken } from '../api';

export interface UserResponse {
  id: string;
  anonymousId: string;
  role: string;
  email: string | null;
  isActive: boolean;
  staffStatus: string | null;
  createdAt: string;
}

interface SuperAdminPageProps {
  onBack?: () => void;
}

export function SuperAdminPage({ onBack }: SuperAdminPageProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);



  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/users?limit=100&includeInactive=true");
      if (res?.data?.items) {
        const staff = res.data.items.filter((u: UserResponse) =>
          ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)
        );
        setUsers(staff);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdatingId(id);
    
    // Optimistic UI update
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, staffStatus: newStatus } : u)));
    
    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ staffStatus: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Rollback
      fetchStaff();
    } finally {
      setIsUpdatingId(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#2D6DB5] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold flex-1">GIBI-GUBAE SUPER ADMIN</h1>
          <button
            onClick={() => {
              removeAuthToken();
              navigate('/');
            }}
            className="text-white/80 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-8 max-w-[1200px] w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-bold text-gray-900 text-2xl flex items-center gap-2">
              <ShieldCheck className="text-[#2D6DB5]" size={28} />
              Staff Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Approve, suspend, and manage staff accounts.
            </p>
          </div>
          <button
            onClick={fetchStaff}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {/* Manage Notifications Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-[#2D6DB5]">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Notification Center</h3>
              <p className="text-sm text-gray-500">Push, edit, and manage all notifications sent to staff or the public.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/superadmin/notifications')}
            className="flex-shrink-0 px-5 py-2 bg-[#2D6DB5] hover:bg-[#245A94] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Manage Notifications →
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Loading staff members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 flex flex-col items-center justify-center">
                      <Users size={32} className="text-gray-300 mb-2" />
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.email || 'Anonymous'}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">{user.anonymousId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === 'SUPER_ADMIN' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : user.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          user.staffStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.staffStatus === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.staffStatus === 'APPROVED' && <ShieldCheck size={14} />}
                          {user.staffStatus === 'SUSPENDED' && <ShieldAlert size={14} />}
                          {user.staffStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.staffStatus || 'PENDING'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          disabled={isUpdatingId === user.id || user.role === 'SUPER_ADMIN'}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent disabled:opacity-50 cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
