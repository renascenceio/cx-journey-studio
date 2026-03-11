import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch notifications for current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to match the Notification type
  const notifications = data.map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: n.created_at,
  }))

  return NextResponse.json(notifications)
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { notificationId, markAllRead } = await request.json()

  if (markAllRead) {
    // Mark all as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (notificationId) {
    // Mark single notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
