import React, { useState, useEffect } from 'react';
import { Skill, Exchange, Report, VerificationRequest, ActivityLog, User } from '@/api/entities';
import { auth } from '@/api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Shield, Users, FileText, Flag, Activity, 
  CheckCircle, XCircle, Clock, Search, Eye,
  Ban, Loader2, ArrowRightLeft, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [suspendDialog, setSuspendDialog] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      if (userData.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(userData);
    } catch (e) {
      window.location.href = '/';
    }
  };

  // Queries
  const { data: allUsers = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => User.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: verificationRequests = [] } = useQuery({
    queryKey: ['verificationRequests'],
    queryFn: () => VerificationRequest.filter({ status: 'pending' }, '-created_date'),
    enabled: !!user,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => Report.filter({ status: 'pending' }, '-created_date'),
    enabled: !!user,
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ['adminSkills'],
    queryFn: () => Skill.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: allExchanges = [] } = useQuery({
    queryKey: ['adminExchanges'],
    queryFn: () => Exchange.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => ActivityLog.list('-created_date', 50),
    enabled: !!user,
  });

  // Mutations
  const approveVerificationMutation = useMutation({
    mutationFn: async (request) => {
      await VerificationRequest.update(request.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
      });
      // Update user as verified
      const users = await User.filter({ id: request.user_id });
      if (users[0]) {
        await User.update(request.user_id, {
          is_verified: true,
          verification_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['verificationRequests']);
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('Verification approved!');
      setSelectedVerification(null);
    }
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: async ({ request, reason }) => {
      await VerificationRequest.update(request.id, {
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['verificationRequests']);
      toast.success('Verification rejected');
      setSelectedVerification(null);
      setRejectionReason('');
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ report, status, notes }) => {
      await Report.update(report.id, {
        status,
        resolution_notes: notes,
        resolved_by: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success('Report resolved');
      setSelectedReport(null);
      setResolutionNotes('');
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      await User.update(userId, {
        is_suspended: true,
        suspension_reason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User suspended');
      setSuspendDialog(null);
    }
  });

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalUsers: allUsers.length,
    verifiedUsers: allUsers.filter(u => u.is_verified).length,
    activeSkills: allSkills.filter(s => s.status === 'active').length,
    completedExchanges: allExchanges.filter(e => e.status === 'completed').length,
    pendingVerifications: verificationRequests.length,
    pendingReports: reports.length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">Manage users, verifications, and reports</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard icon={Users} label="Total Users" value={stats.totalUsers} />
          <StatsCard icon={UserCheck} label="Verified" value={stats.verifiedUsers} color="blue" />
          <StatsCard icon={FileText} label="Active Skills" value={stats.activeSkills} color="emerald" />
          <StatsCard icon={ArrowRightLeft} label="Completed" value={stats.completedExchanges} color="purple" />
          <StatsCard icon={Clock} label="Pending Verifications" value={stats.pendingVerifications} color="amber" />
          <StatsCard icon={Flag} label="Pending Reports" value={stats.pendingReports} color="red" />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="verifications">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-6">
            <TabsTrigger value="verifications" className="rounded-lg px-4">
              Verifications
              {verificationRequests.length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{verificationRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-4">
              Reports
              {reports.length > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-700">{reports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg px-4">
              Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg px-4">
              Activity Log
            </TabsTrigger>
          </TabsList>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle>Pending Verification Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {verificationRequests.length > 0 ? (
                  <div className="space-y-4">
                    {verificationRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-amber-100 text-amber-700">
                              {request.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800">{request.user_name}</p>
                            <p className="text-sm text-slate-500">{request.user_email}</p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(request.created_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{request.id_type?.replace('_', ' ')}</Badge>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVerification(request)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                    <p>No pending verification requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle>Pending Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div 
                        key={report.id} 
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-red-100 text-red-700">
                              {report.reason}
                            </Badge>
                            <Badge variant="outline">
                              {report.reported_content_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">{report.reporter_name}</span> reported <span className="font-medium">{report.reported_user_name}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {report.description?.substring(0, 100)}...
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReport(report)}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Flag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No pending reports</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-slate-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Exchanges</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                  {u.full_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{u.full_name}</p>
                                <p className="text-sm text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {u.is_verified && (
                                <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
                              )}
                              {u.is_suspended && (
                                <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                              )}
                              {u.role === 'admin' && (
                                <Badge className="bg-amber-100 text-amber-700">Admin</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(u.created_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{u.total_exchanges || 0}</TableCell>
                          <TableCell>
                            {!u.is_suspended && u.role !== 'admin' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600"
                                onClick={() => setSuspendDialog(u)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          log.action_type.includes('delete') ? 'bg-red-100' :
                          log.action_type.includes('create') || log.action_type.includes('complete') ? 'bg-emerald-100' :
                          'bg-blue-100'
                        }`}>
                          <Activity className={`w-4 h-4 ${
                            log.action_type.includes('delete') ? 'text-red-600' :
                            log.action_type.includes('create') || log.action_type.includes('complete') ? 'text-emerald-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{log.action_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">{log.user_email}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {format(new Date(log.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No activity logs yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Verification Review Dialog */}
        <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Verification Request</DialogTitle>
            </DialogHeader>
            {selectedVerification && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Name</p>
                    <p className="font-medium">{selectedVerification.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Email</p>
                    <p className="font-medium">{selectedVerification.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">ID Type</p>
                    <p className="font-medium">{selectedVerification.id_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Submitted</p>
                    <p className="font-medium">{format(new Date(selectedVerification.created_date), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">ID Document</p>
                    <a href={selectedVerification.id_document_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={selectedVerification.id_document_url} 
                        alt="ID Document" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Selfie</p>
                    <a href={selectedVerification.selfie_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={selectedVerification.selfie_url} 
                        alt="Selfie" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-2">Rejection Reason (if rejecting)</p>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedVerification(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => rejectVerificationMutation.mutate({ 
                      request: selectedVerification, 
                      reason: rejectionReason 
                    })}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approveVerificationMutation.mutate(selectedVerification)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Review Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Report</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <Badge className="bg-red-100 text-red-700 mb-2">{selectedReport.reason}</Badge>
                  <p className="text-slate-700">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Reporter</p>
                    <p className="font-medium">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Reported User</p>
                    <p className="font-medium">{selectedReport.reported_user_name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-2">Resolution Notes</p>
                  <Textarea
                    placeholder="Enter resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => resolveReportMutation.mutate({
                      report: selectedReport,
                      status: 'dismissed',
                      notes: resolutionNotes
                    })}
                  >
                    Dismiss
                  </Button>
                  <Button 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    onClick={() => resolveReportMutation.mutate({
                      report: selectedReport,
                      status: 'resolved',
                      notes: resolutionNotes
                    })}
                  >
                    Resolve & Warn User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <AlertDialog open={!!suspendDialog} onOpenChange={() => setSuspendDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend {suspendDialog?.full_name}? They will not be able to access the platform until unsuspended.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => suspendUserMutation.mutate({ 
                  userId: suspendDialog.id, 
                  reason: 'Suspended by admin' 
                })}
              >
                Suspend User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="border-slate-100">
      <CardContent className="p-4">
        <div className={`p-2 rounded-lg w-fit ${colors[color]} mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </CardContent>
    </Card>
  );
}