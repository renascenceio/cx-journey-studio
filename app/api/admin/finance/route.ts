"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// B10: Admin Finance Module - Revenue & Transaction Tracking API
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "30d"

  // Calculate date range
  const now = new Date()
  let startDate: Date
  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case "ytd":
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default: // 30d
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  try {
    // Get transactions from credit_transactions table
    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (txError) throw txError

    // Calculate revenue metrics
    const purchaseTransactions = transactions?.filter(t => t.type === "purchase") || []
    const totalRevenue = purchaseTransactions.reduce((sum, t) => sum + (t.amount_usd || 0), 0)
    const totalCredits = purchaseTransactions.reduce((sum, t) => sum + (t.credits || 0), 0)

    // Get previous period for comparison
    const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const { data: prevTransactions } = await supabase
      .from("credit_transactions")
      .select("*")
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", startDate.toISOString())

    const prevPurchases = prevTransactions?.filter(t => t.type === "purchase") || []
    const prevRevenue = prevPurchases.reduce((sum, t) => sum + (t.amount_usd || 0), 0)

    // Revenue trend by day
    const revenueTrend: { date: string; revenue: number; transactions: number }[] = []
    const trendDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]
      const dayTx = purchaseTransactions.filter(t => t.created_at?.startsWith(dateStr))
      revenueTrend.push({
        date: dateStr,
        revenue: dayTx.reduce((sum, t) => sum + (t.amount_usd || 0), 0),
        transactions: dayTx.length,
      })
    }

    // Revenue by plan/product
    const revenueByProduct: Record<string, number> = {}
    purchaseTransactions.forEach(t => {
      const product = t.description || "Credit Purchase"
      revenueByProduct[product] = (revenueByProduct[product] || 0) + (t.amount_usd || 0)
    })

    // Get subscription stats from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("plan, created_at")

    const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 }
    profiles?.forEach(p => {
      const plan = p.plan || "free"
      planCounts[plan] = (planCounts[plan] || 0) + 1
    })

    // Monthly Recurring Revenue estimate (based on active pro/enterprise users)
    const proPrice = 29 // $29/month
    const enterprisePrice = 99 // $99/month
    const mrr = (planCounts.pro * proPrice) + (planCounts.enterprise * enterprisePrice)

    // Average Revenue Per User
    const totalUsers = profiles?.length || 1
    const arpu = totalRevenue / totalUsers

    // Recent transactions (limit 50)
    const recentTransactions = transactions?.slice(0, 50).map(t => ({
      id: t.id,
      user_id: t.user_id,
      type: t.type,
      credits: t.credits,
      amount_usd: t.amount_usd,
      description: t.description,
      created_at: t.created_at,
    })) || []

    // Get user emails for recent transactions
    const userIds = [...new Set(recentTransactions.map(t => t.user_id))]
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    const transactionsWithUsers = recentTransactions.map(t => ({
      ...t,
      user_email: userMap.get(t.user_id)?.email || "Unknown",
      user_name: userMap.get(t.user_id)?.full_name || "Unknown User",
    }))

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalCredits,
        transactionCount: purchaseTransactions.length,
        mrr,
        arpu: Math.round(arpu * 100) / 100,
        revenueGrowth: prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0,
      },
      planCounts,
      revenueTrend,
      revenueByProduct: Object.entries(revenueByProduct).map(([name, value]) => ({ name, value })),
      recentTransactions: transactionsWithUsers,
    })
  } catch (error) {
    console.error("Finance API error:", error)
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 })
  }
}
