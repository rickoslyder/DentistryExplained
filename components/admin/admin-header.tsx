'use client'

import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Bell, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function AdminHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search articles, categories, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/admin/articles/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            
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