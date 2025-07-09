"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { 
  Shield, CheckCircle, XCircle, Clock, ExternalLink, FileText, 
  Search, Filter, RefreshCw, Download, Eye, AlertCircle, Edit 
} from "lucide-react"
import { ProfessionalVerification, VerificationDocument, VerificationStats } from "@/types/professional"

export default function AdminVerificationsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [verifications, setVerifications] = useState<ProfessionalVerification[]>([])
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    expired: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedVerification, setSelectedVerification] = useState<ProfessionalVerification | null>(null)
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadVerifications()
    }
  }, [isAdmin, statusFilter])

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        setIsAdmin(true)
      } else {
        router.push('/')
        toast.error('Access denied. Admin privileges required.')
      }
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/')
    }
  }

  const loadVerifications = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/verifications?${params}`)
      if (!response.ok) throw new Error('Failed to load verifications')

      const data = await response.json()
      setVerifications(data.verifications)
      setStats(data.stats)
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Failed to load verifications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (verificationId: string) => {
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}/documents`)
      if (!response.ok) throw new Error('Failed to load documents')

      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Document load error:', error)
      toast.error('Failed to load documents')
    }
  }

  const handleReview = async (verification: ProfessionalVerification) => {
    setSelectedVerification(verification)
    setIsReviewDialogOpen(true)
    await loadDocuments(verification.id)
  }

  const handleEdit = (verification: ProfessionalVerification) => {
    setSelectedVerification(verification)
    setEditData({
      practice_name: verification.practice_name || '',
      practice_address: verification.practice_address || '',
      practice_phone: verification.practice_phone || '',
      practice_website: verification.practice_website || '',
      practice_email: verification.practice_email || '',
      gdc_number: verification.gdc_number || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedVerification) return

    try {
      const response = await fetch(`/api/admin/users/${selectedVerification.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) throw new Error('Failed to update practice details')

      toast.success('Practice details updated successfully')
      setIsEditDialogOpen(false)
      loadVerifications()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update practice details')
    }
  }

  const submitReview = async () => {
    if (!selectedVerification || !reviewAction) return

    try {
      const body: any = {
        action: reviewAction,
      }

      if (reviewAction === 'reject') {
        body.rejection_reason = rejectionReason
      } else if (reviewAction === 'approve' && expiryDate) {
        body.expiry_date = new Date(expiryDate).toISOString()
      }

      const response = await fetch(`/api/admin/verifications/${selectedVerification.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Failed to submit review')

      toast.success(`Verification ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`)
      setIsReviewDialogOpen(false)
      setSelectedVerification(null)
      setRejectionReason("")
      setExpiryDate("")
      loadVerifications()
    } catch (error) {
      console.error('Review error:', error)
      toast.error('Failed to submit review')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredVerifications = verifications.filter(v => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        v.gdc_number.includes(search) ||
        v.full_name.toLowerCase().includes(search) ||
        v.practice_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professional Verifications</h1>
          <p className="text-gray-600 mt-2">Review and manage professional verification requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by GDC number, name, or practice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="verified">Verified</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={loadVerifications} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verifications Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GDC Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">{verification.gdc_number}</TableCell>
                    <TableCell>{verification.full_name}</TableCell>
                    <TableCell>{verification.practice_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(verification.verification_status)}</TableCell>
                    <TableCell>
                      {format(new Date(verification.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(verification)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(verification)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a
                            href={`https://olr.gdc-uk.org/searchregister?gdc=${verification.gdc_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredVerifications.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No verifications found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
            <DialogDescription>
              Review the verification details and supporting documents
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* Verification Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Verification Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">GDC Number</Label>
                    <p className="font-medium">{selectedVerification.gdc_number}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Full Name</Label>
                    <p className="font-medium">{selectedVerification.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Practice Name</Label>
                    <p className="font-medium">{selectedVerification.practice_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Current Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedVerification.verification_status)}</div>
                  </div>
                </div>
                {selectedVerification.practice_address && (
                  <div>
                    <Label className="text-gray-600">Practice Address</Label>
                    <p className="font-medium mt-1">{selectedVerification.practice_address}</p>
                  </div>
                )}
                {selectedVerification.additional_notes && (
                  <div>
                    <Label className="text-gray-600">Additional Notes</Label>
                    <p className="font-medium mt-1">{selectedVerification.additional_notes}</p>
                  </div>
                )}
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold">Supporting Documents</h3>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">{doc.document_type}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No supporting documents uploaded</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Review Actions */}
              {selectedVerification.verification_status === 'pending' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Review Decision</h3>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setReviewAction('approve')}
                      variant={reviewAction === 'approve' ? 'default' : 'outline'}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setReviewAction('reject')}
                      variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {reviewAction === 'approve' && (
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Leave blank for no expiry
                      </p>
                    </div>
                  )}

                  {reviewAction === 'reject' && (
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        rows={3}
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            {reviewAction && selectedVerification?.verification_status === 'pending' && (
              <Button
                onClick={submitReview}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                disabled={reviewAction === 'reject' && !rejectionReason}
              >
                {reviewAction === 'approve' ? 'Approve Verification' : 'Reject Verification'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Practice Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Practice Details</DialogTitle>
            <DialogDescription>
              Update practice information for {selectedVerification?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gdc_number">GDC Number</Label>
              <Input
                id="gdc_number"
                value={editData.gdc_number || ''}
                onChange={(e) => setEditData({ ...editData, gdc_number: e.target.value })}
                placeholder="e.g., 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice_name">Practice Name</Label>
              <Input
                id="practice_name"
                value={editData.practice_name || ''}
                onChange={(e) => setEditData({ ...editData, practice_name: e.target.value })}
                placeholder="e.g., Smile Dental Clinic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice_address">Practice Address</Label>
              <Textarea
                id="practice_address"
                value={editData.practice_address || ''}
                onChange={(e) => setEditData({ ...editData, practice_address: e.target.value })}
                placeholder="Full practice address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practice_phone">Practice Phone</Label>
                <Input
                  id="practice_phone"
                  value={editData.practice_phone || ''}
                  onChange={(e) => setEditData({ ...editData, practice_phone: e.target.value })}
                  placeholder="e.g., 020 1234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practice_email">Practice Email</Label>
                <Input
                  id="practice_email"
                  type="email"
                  value={editData.practice_email || ''}
                  onChange={(e) => setEditData({ ...editData, practice_email: e.target.value })}
                  placeholder="e.g., info@practice.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="practice_website">Practice Website</Label>
              <Input
                id="practice_website"
                value={editData.practice_website || ''}
                onChange={(e) => setEditData({ ...editData, practice_website: e.target.value })}
                placeholder="e.g., https://www.practice.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditData({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}