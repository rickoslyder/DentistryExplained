'use client'

import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, Plus, Home, FileText, FolderOpen, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <form onSubmit={handleSearch} className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search articles, categories, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/admin/articles/new">
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    New Article
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/categories/new">
                  <DropdownMenuItem>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    New Category
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/glossary">
                  <DropdownMenuItem>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Add Glossary Term
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* View Site Button */}
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Site
              </Button>
            </Link>
            
            {/* Quick Nav to Dashboard */}
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Go to Dashboard">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* User Menu */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}