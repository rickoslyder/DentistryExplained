"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, Search, BookOpen, MapPin, Users, FileText, Shield, AlertCircle, HelpCircle, Phone, Stethoscope, CreditCard, Heart, Info, Clock, Image, MessageSquare, Mail, LayoutDashboard, BarChart, ScrollText, Activity, Settings, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { UserButton, useUser } from "@clerk/nextjs"
import { AIAssistantButton } from "@/components/chat/ai-assistant-button"
import { SearchDialog } from "@/components/search/search-dialog"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useIsAdmin } from "@/lib/hooks/use-is-admin"

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isSignedIn, user } = useUser()
  const { bookmarks } = useBookmarks()
  const { isAdmin } = useIsAdmin()
  
  const isProfessional = user?.publicMetadata?.userType === 'professional'

  const topicCategories = [
    {
      id: "dental-problems",
      title: "Dental Problems",
      description: "Common dental issues, symptoms, and causes",
      href: "/categories/dental-problems"
    },
    {
      id: "treatments",
      title: "Treatments",
      description: "Dental procedures and treatment options",
      href: "/categories/treatments"
    },
    {
      id: "prevention",
      title: "Prevention",
      description: "Maintaining good oral health",
      href: "/categories/prevention"
    },
    {
      id: "oral-surgery",
      title: "Oral Surgery",
      description: "Surgical procedures and what to expect",
      href: "/categories/oral-surgery"
    },
    {
      id: "cosmetic-dentistry",
      title: "Cosmetic Dentistry",
      description: "Improving the appearance of your smile",
      href: "/categories/cosmetic-dentistry"
    },
    {
      id: "pediatric-dentistry",
      title: "Pediatric Dentistry",
      description: "Dental care for children",
      href: "/categories/pediatric-dentistry"
    }
  ]

  const adminResources = [
    {
      title: "Content Management",
      items: [
        {
          title: "Articles",
          description: "Create and manage articles",
          href: "/admin/articles",
          icon: FileText
        },
        {
          title: "Categories",
          description: "Organize content categories",
          href: "/admin/categories",
          icon: BookOpen
        },
        {
          title: "Glossary",
          description: "Manage dental terms",
          href: "/admin/glossary",
          icon: BookOpen
        },
        {
          title: "Media Library",
          description: "Manage images and documents",
          href: "/admin/media",
          icon: Image
        },
        {
          title: "Comments",
          description: "Moderate user comments",
          href: "/admin/comments",
          icon: MessageSquare
        }
      ]
    },
    {
      title: "User Management",
      items: [
        {
          title: "Users",
          description: "View and manage users",
          href: "/admin/users",
          icon: Users
        },
        {
          title: "Verifications",
          description: "Professional verification requests",
          href: "/admin/verifications",
          icon: Shield
        },
        {
          title: "Email Templates",
          description: "Manage email communications",
          href: "/admin/email-templates",
          icon: Mail
        }
      ]
    },
    {
      title: "Analytics & Monitoring",
      items: [
        {
          title: "Dashboard",
          description: "Site overview and widgets",
          href: "/admin",
          icon: LayoutDashboard
        },
        {
          title: "Analytics",
          description: "Detailed analytics reports",
          href: "/admin/analytics",
          icon: BarChart
        },
        {
          title: "Activity Logs",
          description: "System activity history",
          href: "/admin/activity",
          icon: ScrollText
        },
        {
          title: "Monitoring",
          description: "System health and performance",
          href: "/admin/monitoring",
          icon: Activity
        }
      ]
    },
    {
      title: "System",
      items: [
        {
          title: "Advanced Search",
          description: "Powerful search tools",
          href: "/admin/search",
          icon: Search
        },
        {
          title: "Settings",
          description: "System configuration",
          href: "/admin/settings",
          icon: Settings
        },
        {
          title: "Dev Tools",
          description: "Development utilities",
          href: "/admin/dev",
          icon: Wrench
        }
      ]
    }
  ]

  const resourceCategories = [
    {
      title: "Emergency & Urgent Care",
      items: [
        {
          title: "Emergency Dental Guide",
          description: "Immediate help for dental emergencies",
          href: "/emergency",
          icon: AlertCircle,
          urgent: true
        },
        {
          title: "NHS 111",
          description: "24/7 NHS urgent care helpline",
          href: "tel:111",
          icon: Phone,
          external: true
        }
      ]
    },
    {
      title: "Educational Resources",
      items: [
        {
          title: "Dental Glossary",
          description: "A-Z guide of dental terms",
          href: "/glossary",
          icon: BookOpen
        },
        {
          title: "Search Articles",
          description: "Find specific information quickly",
          href: "/search",
          icon: Search
        }
      ]
    },
    {
      title: "Patient Support",
      items: [
        {
          title: "Find a Dentist",
          description: "Locate dental practices near you",
          href: "/find-dentist",
          icon: Stethoscope
        },
        {
          title: "Treatment Costs",
          description: "NHS charges and private costs",
          href: "/treatments#costs",
          icon: CreditCard
        }
      ]
    },
    ...(isProfessional ? [{
      title: "Professional Resources",
      items: [
        {
          title: "Patient Education",
          description: "Printable guides and leaflets",
          href: "/professional/resources/patient-education",
          icon: Heart,
          isPro: true
        },
        {
          title: "Consent Forms",
          description: "Downloadable consent templates",
          href: "/professional/resources/consent-forms",
          icon: FileText,
          isPro: true
        }
      ]
    }] : [])
  ]

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
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-700 hover:text-primary transition-colors font-medium">
                  Topics
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {topicCategories.map((category) => (
                      <li key={category.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={category.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{category.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {category.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li className="col-span-full">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/topics"
                          className="flex items-center justify-center rounded-md bg-primary/10 p-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          View All Topics →
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-700 hover:text-primary transition-colors font-medium">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[600px] p-4">
                    <div className="grid grid-cols-2 gap-6">
                      {resourceCategories.map((category, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                          <ul className="space-y-2">
                            {category.items.map((item, itemIdx) => {
                              const Icon = item.icon
                              return (
                                <li key={itemIdx}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={item.href}
                                      className="group flex items-start space-x-3 rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                    >
                                      <Icon className={`w-5 h-5 mt-0.5 ${item.urgent ? 'text-red-500' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium leading-none">{item.title}</span>
                                          {item.urgent && (
                                            <Badge variant="destructive" className="text-xs">URGENT</Badge>
                                          )}
                                          {item.isPro && (
                                            <Badge variant="secondary" className="text-xs">PRO</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                          {item.description}
                                        </p>
                                      </div>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/resources"
                          className="flex items-center justify-center rounded-md bg-primary/10 p-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          View All Resources →
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/find-dentist" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle() + " text-gray-700 hover:text-primary transition-colors font-medium"}>
                    Find a Dentist
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/professional" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle() + " text-gray-700 hover:text-primary transition-colors font-medium"}>
                    For Professionals
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-700 hover:text-primary transition-colors font-medium">
                    Admin
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[700px] p-4">
                      <div className="grid grid-cols-2 gap-6">
                        {adminResources.map((category, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                            <ul className="space-y-2">
                              {category.items.map((item, itemIdx) => {
                                const Icon = item.icon
                                return (
                                  <li key={itemIdx}>
                                    <NavigationMenuLink asChild>
                                      <Link
                                        href={item.href}
                                        className="group flex items-start space-x-3 rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                                      >
                                        <Icon className="w-5 h-5 mt-0.5 text-muted-foreground group-hover:text-accent-foreground" />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium leading-none">{item.title}</div>
                                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                            {item.description}
                                          </p>
                                        </div>
                                      </Link>
                                    </NavigationMenuLink>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

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

            {/* Emergency Button with Tooltip */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/emergency">
                    <Button variant="destructive" size="icon" className="hidden sm:flex">
                      <AlertCircle className="w-5 h-5" />
                      <span className="sr-only">Emergency Guide</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Emergency Guide</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
                    href="/emergency"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Emergency Guide</span>
                  </Link>
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
