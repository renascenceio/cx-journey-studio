import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST - Create test notifications for current user
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Insert test notifications
  const notifications = [
    {
      user_id: user.id,
      type: "mention",
      message: 'John Smith mentioned you in a comment on "Mashreq Bank Retail Journey"',
      link: "/journeys/027705bd-321d-4017-9c16-f0c86ff31932/canvas",
    },
    {
      user_id: user.id,
      type: "share",
      message: 'Sarah Johnson added you as a collaborator on "Customer Onboarding Journey"',
      link: "/journeys/027705bd-321d-4017-9c16-f0c86ff31932/canvas",
    },
    {
      user_id: user.id,
      type: "share",
      message: 'Mike Wilson removed you as a collaborator from "Support Experience Journey"',
      link: "/journeys",
    },
  ]

  const { data, error } = await supabase
    .from("notifications")
    .insert(notifications)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, notifications: data })
}
