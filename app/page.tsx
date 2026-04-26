"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/store-provider"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  const { currentUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  return <LoginForm />
}
