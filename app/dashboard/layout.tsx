"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/store-provider"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:pl-0 pl-16">
        {children}
      </main>
    </div>
  )
}
