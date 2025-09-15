"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { api, formatCurrency, formatDate } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Car, 
  FileText, 
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Bell,
  Shield,
  Crown,
  CreditCard,
  Star,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react"

interface DashboardData {
  user: {
    name: string
    email: string
    createdAt: string
    hpiCredits?: number
  }
  appeals: {
    total: number
    pending: number
    approved: number
    rejected: number
    recent: any[]
  }
  vehicles: {
    total: number
    recent: any[]
  }
  hpiChecks: {
    total: number
    recent: any[]
  }
  stats: {
    totalSaved: number
    successRate: number
  }
}

interface UserDashboardProps {
  onNavigate: (section: string) => void
}

interface OutcomeModalProps {
  appeal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (appealId: string, outcome: string, notes?: string) => void;
}

const OutcomeModal: React.FC<OutcomeModalProps> = ({
  appeal,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [outcome, setOutcome] = useState(appeal?.userReportedOutcome || '');
  const [notes, setNotes] = useState(appeal?.outcomeNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appeal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outcome) {
      toast({
        title: "Error",
        description: "Please select an outcome for your appeal.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onUpdate(appeal.id, outcome, notes);
      onClose();
    } catch (error) {
      console.error('Failed to update outcome:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          Update Appeal Outcome
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Fine: {appeal.fineReference}
          </p>
          <p className="text-sm text-gray-600">
            Reason: {appeal.reason}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              What was the outcome of your appeal?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="outcome"
                  value="successful"
                  checked={outcome === 'successful'}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="mr-2"
                />
                <span className="text-green-600">✓ Successful</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="outcome"
                  value="unsuccessful"
                  checked={outcome === 'unsuccessful'}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="mr-2"
                />
                <span className="text-red-600">✗ Unsuccessful</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="outcome"
                  value="pending"
                  checked={outcome === 'pending'}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="mr-2"
                />
                <span className="text-yellow-600">⏳ Still Pending</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Any additional details about the outcome..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Updating...' : 'Update Outcome'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [userUsage, setUserUsage] = useState<any>(null)
  const [hpiCredits, setHpiCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
      fetchUserUsage()
      fetchHpiCredits()
    }
  }, [session])

  const fetchHpiCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setHpiCredits(data.hpiCredits || 0)
      }
    } catch (error) {
      console.error('Error fetching HPI credits:', error)
    }
  }

  const fetchUserUsage = async () => {
    try {
      const response = await fetch('/api/user/usage')
      if (response.ok) {
        const data = await response.json()
        setUserUsage(data)
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const data = await api.get("/api/user/dashboard")
      setDashboardData(data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAppealOutcome = async (appealId: string, outcome: string, notes?: string) => {
    try {
      const response = await fetch('/api/appeals/outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appealId,
          outcome,
          notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Appeal outcome updated successfully",
        });
        
        // Refresh the dashboard data
        await fetchDashboardData();
      } else {
        throw new Error(data.error || 'Failed to update outcome');
      }
    } catch (error) {
      console.error('Failed to update appeal outcome:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update outcome",
        variant: "destructive"
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to ClearRideAI!</h2>
        <p className="text-gray-600 mb-8">Get started by adding a vehicle or setting up reminders.</p>
        <div className="flex gap-4">
          <Button onClick={() => onNavigate("vehicle-checks")}>
            <Car className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
          <Button onClick={() => onNavigate("reminders")} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Set Reminders
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "UNDER_REVIEW":
        return <Badge variant="secondary">Under Review</Badge>
      case "SUBMITTED":
        return <Badge variant="outline">Submitted</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome || outcome === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
    }
    
    if (outcome === 'successful') {
      return <Badge className="bg-green-100 text-green-800">✓ Successful</Badge>;
    }
    
    if (outcome === 'unsuccessful') {
      return <Badge className="bg-red-100 text-red-800">✗ Unsuccessful</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800">{outcome}</Badge>;
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {dashboardData.user.name}!</h1>
            <p className="text-gray-600">Here's your ClearRideAI dashboard overview</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Member since {formatDate(dashboardData.user.createdAt)}</p>
          </div>
        </div>

        {/* Payment Status */}
        {userUsage && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Pay-Per-Use Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <div>
                    <span className="font-semibold text-lg">HPI Credits Available</span>
                    <p className="text-sm text-gray-600">Use credits to perform HPI checks</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{hpiCredits}</span>
                    <p className="text-sm text-gray-500">credits</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">HPI Checks:</span> 1 credit per check (£5 value)
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Appeals:</span> 1 free trial per vehicle, then £2 each
                </div>
                {userUsage.appealTrialUsed && (
                  <div className="text-sm text-amber-600">
                    Free trial used for: {userUsage.appealTrialReg}
                  </div>
                )}
                <div className="text-sm text-green-600 font-medium">
                  {hpiCredits === 0 ? (
                    <span className="text-orange-600">Purchase HPI credits to perform vehicle checks</span>
                  ) : (
                    "Use your credits for instant vehicle history reports"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appeals</p>
                  <p className="text-2xl font-bold">{dashboardData.appeals.total}</p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Appeals</p>
                  <p className="text-2xl font-bold">{dashboardData.appeals.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">HPI Checks</p>
                  <p className="text-2xl font-bold">{dashboardData.hpiChecks.total}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appeals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Appeals
            </CardTitle>
            <Button onClick={() => onNavigate("appeals")} variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData.appeals.recent.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No appeals submitted yet</p>
                <Button onClick={() => onNavigate("appeals")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Appeal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.appeals.recent.map((appeal: any) => (
                  <motion.div 
                    key={appeal.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Fine: {appeal.fineReference}</p>
                        {appeal.aiGenerated && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            🤖 AI Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Amount: {formatCurrency(appeal.fineAmount)}</p>
                      <p className="text-sm text-gray-600">Reason: {appeal.reason}</p>
                      
                      {/* Outcome Section */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">Outcome:</span>
                        {getOutcomeBadge(appeal.userReportedOutcome)}
                        {appeal.userReportedAt && (
                          <span className="text-xs text-gray-500">
                            (Reported {formatDate(appeal.userReportedAt)})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div>
                        {getStatusBadge(appeal.status)}
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(appeal.createdAt)}
                        </p>
                      </div>
                      
                      {/* Report Outcome Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setIsModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        {appeal.userReportedOutcome && appeal.userReportedOutcome !== 'pending' 
                          ? 'Update Outcome' 
                          : 'Report Outcome'
                        }
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => onNavigate("appeals")} className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Submit New Appeal
            </Button>
            <Button onClick={() => onNavigate("hpi-checks")} variant="outline" className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
              <Shield className="h-4 w-4 mr-2" />
              Run HPI Check
            </Button>
            <Button onClick={() => onNavigate("vehicle-checks")} variant="outline" className="w-full justify-start">
              <Car className="h-4 w-4 mr-2" />
              Check Vehicle Status
            </Button>
            <Button onClick={() => onNavigate("reminders")} variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
            {dashboardData.appeals.total > 0 && (
              <Button 
                onClick={() => window.open('/dashboard', '_blank')} 
                variant="outline" 
                className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Appeal Analytics
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Appeal Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Submit appeals within 28 days</li>
                  <li>• Include clear photographic evidence</li>
                  <li>• Be specific about why the fine is incorrect</li>
                  <li>• Keep copies of all correspondence</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Vehicle Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check MOT status regularly</li>
                  <li>• Set up renewal reminders</li>
                  <li>• Run HPI checks before buying</li>
                  <li>• Keep vehicle documents updated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Small Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          <p>
            <Link href="/terms" target="_blank" className="hover:text-gray-700 underline">
              Terms & Conditions
            </Link>
            {" • "}
            <Link href="/privacy" target="_blank" className="hover:text-gray-700 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Outcome Modal */}
      {selectedAppeal && (
        <OutcomeModal
          appeal={selectedAppeal}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppeal(null);
          }}
          onUpdate={updateAppealOutcome}
        />
      )}
    </div>
  )
}
