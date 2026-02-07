'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Shield, Search, ChevronLeft, ChevronRight, Trash2, Crown, Sparkles, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';

interface User {
  id: string;
  email: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
  stats: {
    resumes: number;
    coverLetters: number;
    linkedinMessages: number;
    emailMessages: number;
    totalMessages: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Use React Query hook for admin users
  const { users, pagination, isLoading, invalidateUsers } = useAdminUsers(page, userTypeFilter, search);
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;

  const updateUserType = async (userId: string, newType: 'FREE' | 'PLUS' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: newType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'User type updated successfully',
      });

      invalidateUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      invalidateUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const getUserTypeBadge = (type: string) => {
    const colors = {
      FREE: 'bg-slate-100 text-slate-700 border-slate-200',
      PLUS: 'bg-purple-100 text-purple-700 border-purple-200',
      ADMIN: 'bg-red-100 text-red-700 border-red-200',
    };
    const icons = {
      FREE: null,
      PLUS: <Crown className="w-3 h-3" />,
      ADMIN: <Shield className="w-3 h-3" />,
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${colors[type as keyof typeof colors]}`}>
        {icons[type as keyof typeof icons]}
        {type}
      </span>
    );
  };

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-bold text-slate-900">User Management</h2>
        </div>

        <LiveClock />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[42px] font-bold text-slate-900 leading-tight">User Management</h1>
                <p className="text-lg text-slate-500">{totalCount} total users</p>
              </div>
            </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Users</SelectItem>
              <SelectItem value="FREE">Free Users</SelectItem>
              <SelectItem value="PLUS">Plus Users</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">API Keys</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{user.email}</div>
                        <div className="text-xs text-slate-500">{user.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={user.userType}
                          onValueChange={(value) => updateUserType(user.id, value as any)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="PLUS">PLUS</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.hasOpenaiKey && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">OpenAI</span>}
                          {user.hasAnthropicKey && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Claude</span>}
                          {user.hasGeminiKey && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Gemini</span>}
                          {!user.hasOpenaiKey && !user.hasAnthropicKey && !user.hasGeminiKey && (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{user.stats.totalMessages} generated</div>
                        <div className="text-xs text-slate-500">{user.stats.resumes} resumes</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
