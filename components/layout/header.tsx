"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, Search, BookOpen, MapPin, Users, FileText, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserButton, useUser } from "@clerk/nextjs"
import { AIAssistantButton } from "@/components/chat/ai-assistant-button"
import { SearchDialog } from "@/components/search/search-dialog"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useIsAdmin } from "@/lib/hooks/use-is-admin"

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isSignedIn } = useUser()
  const { bookmarks } = useBookmarks()
  const { isAdmin } = useIsAdmin()

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-primary hidden sm:block">Dentistry Explained</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/topics" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Topics
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Resources
            </Link>
            <Link href="/find-dentist" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Find a Dentist
            </Link>
            <Link href="/professional" className="text-gray-700 hover:text-primary transition-colors font-medium">
              For Professionals
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-primary transition-colors font-medium">
                Admin
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden sm:flex">
              <Search className="w-5 h-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* AI Assistant Button */}
            <AIAssistantButton />

            {/* User Menu */}
            {isSignedIn ? (
              <div className="flex items-center space-x-2">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="relative">
                    Dashboard
                    {bookmarks.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {bookmarks.length}
                      </span>
                    )}
                  </Button>
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    href="/topics"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="font-medium">Topics</span>
                  </Link>
                  <Link
                    href="/resources"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">Resources</span>
                  </Link>
                  <Link
                    href="/find-dentist"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">Find a Dentist</span>
                  </Link>
                  <Link
                    href="/professional"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-medium">For Professionals</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                  )}
                  <div className="pt-4 border-t">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setIsSearchOpen(true)}>
                      <Search className="w-5 h-5 mr-3" />
                      Search
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
