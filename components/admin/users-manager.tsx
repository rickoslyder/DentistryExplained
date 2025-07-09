'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, UserCog, Shield, ChevronLeft, ChevronRight, Search, Edit, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'

interface User {
  id: string
  clerk_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  user_type: 'patient' | 'professional'
  role: 'user' | 'admin' | 'editor'
  avatar_url: string | null
  created_at: string
  last_login: string | null
  verification_status: string | null
}

interface UsersManagerProps {
  users: User[]
  stats: {
    total: number
    patients: number
    professionals: number
    admins: number
  }
  currentPage: number
  totalPages: number
  totalCount: number
}

export function UsersManager({ 
  users, 
  stats, 
  currentPage, 
  totalPages,
  totalCount 
}: UsersManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<string>('')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState<any>({})

  // Update URL with search params
  const updateSearch = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })
    
    // Reset to page 1 when filters change
    if (params.page === undefined) {
      current.set('page', '1')
    }
    
    router.push(`/admin/users?${current.toString()}`)
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    updateSearch({ search: value })
  }

  // Handle role update
  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast({
        title: 'Role updated',
        description: `User role updated to ${newRole}`,
      })

      router.refresh()
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      })
    }
  }

  // Handle user update
  const handleUserUpdate = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast({
        title: 'User updated',
        description: 'User details have been updated successfully',
      })

      router.refresh()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setEditData({})
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    }
  }

  const getInitials = (user: User) => {
    const firstInitial = user.first_name?.[0] || user.email[0]
    const lastInitial = user.last_name?.[0] || ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getUserTypeBadgeVariant = (type: string) => {
    return type === 'professional' ? 'default' : 'secondary'
  }

  const getVerificationBadge = (status: string | null) => {
    if (!status) return null
    
    const variants: Record<string, string> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
    }
    
    return (
      <Badge variant={variants[status] as any} className="ml-2">
        {status}
      </Badge>
    )
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patients}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professionals</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professionals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={searchParams.get('type') || 'all'}
              onValueChange={(value) => updateSearch({ type: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="patient">Patients</SelectItem>
                <SelectItem value="professional">Professionals</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={searchParams.get('role') || 'all'}
              onValueChange={(value) => updateSearch({ role: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUserTypeBadgeVariant(user.user_type)}>
                      {user.user_type}
                    </Badge>
                    {user.user_type === 'professional' && getVerificationBadge(user.verification_status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_login 
                      ? format(new Date(user.last_login), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setEditData({
                              user_type: user.user_type,
                              practice_name: '',
                              practice_address: '',
                              gdc_number: '',
                              verification_status: user.verification_status || 'pending',
                            })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.role)
                            setIsRoleDialogOpen(true)
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => updateSearch({ page: String(currentPage - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => updateSearch({ page: String(currentPage + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Role Update Dialog */}
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change role for {selectedUser?.email}. This will affect their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleUpdate}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information and professional details for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <Select 
                value={editData.user_type || 'patient'} 
                onValueChange={(value) => setEditData({ ...editData, user_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editData.user_type === 'professional' && (
              <>
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

                <div className="space-y-2">
                  <Label htmlFor="verification_status">Verification Status</Label>
                  <Select 
                    value={editData.verification_status || 'pending'} 
                    onValueChange={(value) => setEditData({ ...editData, verification_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
                setEditData({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUserUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}