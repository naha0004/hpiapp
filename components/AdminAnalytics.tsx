'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface AppealAnalytics {
  totalAppeals: number;
  aiGeneratedAppeals: number;
  manualAppeals: number;
  successfulAppeals: number;
  unsuccessfulAppeals: number;
  pendingAppeals: number;
  aiSuccessRate: number;
  manualSuccessRate: number;
  overallSuccessRate: number;
  recentAppeals: RecentAppeal[];
}

interface RecentAppeal {
  id: string;
  ticketNumber: string;
  reason: string;
  userEmail: string;
  aiGenerated: boolean;
  userReportedOutcome: string | null;
  userReportedAt: string | null;
  createdAt: string;
  status: string;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AppealAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        toast({
          title: "Error",
          description: "Failed to load analytics",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome || outcome === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    
    if (outcome === 'successful') {
      return <Badge className="bg-green-100 text-green-800">Successful</Badge>;
    }
    
    if (outcome === 'unsuccessful') {
      return <Badge className="bg-red-100 text-red-800">Unsuccessful</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800">{outcome}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Appeal Analytics Dashboard
            </h2>
            <p className="text-gray-600">
              Monitor appeal success rates and AI performance
            </p>
          </div>
          
          <div className="flex space-x-2">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: 'all', label: 'All Time' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Appeals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAppeals}</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.aiGeneratedAppeals} AI • {analytics.manualAppeals} Manual
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overall Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(analytics.overallSuccessRate)}`}>
              {analytics.overallSuccessRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.successfulAppeals} successful of {analytics.totalAppeals} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(analytics.aiSuccessRate)}`}>
              {analytics.aiSuccessRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              AI-generated appeals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Manual Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(analytics.manualSuccessRate)}`}>
              {analytics.manualSuccessRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Manually created appeals
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Appeal Outcomes Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Successful</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.successfulAppeals / analytics.totalAppeals) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-12">{analytics.successfulAppeals}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unsuccessful</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.unsuccessfulAppeals / analytics.totalAppeals) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-12">{analytics.unsuccessfulAppeals}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.pendingAppeals / analytics.totalAppeals) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-12">{analytics.pendingAppeals}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI vs Manual Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">AI Generated Appeals</span>
                  <span className="text-sm font-bold">{analytics.aiGeneratedAppeals}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${analytics.aiSuccessRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.aiSuccessRate.toFixed(1)}% success rate
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Manual Appeals</span>
                  <span className="text-sm font-bold">{analytics.manualAppeals}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${analytics.manualSuccessRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.manualSuccessRate.toFixed(1)}% success rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appeals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appeals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ticket</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Reason</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Outcome</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentAppeals.map((appeal) => (
                  <motion.tr 
                    key={appeal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2">
                      <span className="font-medium">{appeal.ticketNumber}</span>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">{appeal.userEmail}</span>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">{appeal.reason}</span>
                    </td>
                    <td className="p-2">
                      {appeal.aiGenerated ? (
                        <Badge className="bg-purple-100 text-purple-800">AI</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">Manual</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {getOutcomeBadge(appeal.userReportedOutcome)}
                    </td>
                    <td className="p-2">
                      <span className="text-sm text-gray-500">
                        {new Date(appeal.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
