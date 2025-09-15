'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AdminAnalytics from '@/components/AdminAnalytics';

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  // Simple admin check - you may want to enhance this with proper role-based auth
  if (session.user?.email !== 'admin@example.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <AdminAnalytics />
      </main>
    </div>
  );
}
