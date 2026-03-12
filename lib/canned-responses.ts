// B11: Canned Responses for Support System
// Pre-built reply templates for common support scenarios

export interface CannedResponse {
  id: string
  title: string
  body: string
  category: "greeting" | "status" | "resolution" | "followup" | "technical"
  shortcut?: string
}

export const CANNED_RESPONSES: CannedResponse[] = [
  // Greetings
  {
    id: "greeting-1",
    title: "Initial Greeting",
    body: "Hi there! Thank you for reaching out to Journey Design Studio support. I'm here to help you. Let me look into your issue right away.",
    category: "greeting",
    shortcut: "/hi",
  },
  {
    id: "greeting-2",
    title: "Returning Customer",
    body: "Welcome back! I can see your previous conversation history. How can I assist you further today?",
    category: "greeting",
    shortcut: "/wb",
  },

  // Status Updates
  {
    id: "status-1",
    title: "Investigating",
    body: "Thank you for your patience. I'm currently investigating this issue and will update you shortly with my findings.",
    category: "status",
    shortcut: "/inv",
  },
  {
    id: "status-2",
    title: "Escalated to Engineering",
    body: "I've escalated this issue to our engineering team for further investigation. They will review it as a priority, and I'll keep you updated on any progress.",
    category: "status",
    shortcut: "/esc",
  },
  {
    id: "status-3",
    title: "Waiting for Info",
    body: "To help resolve this issue faster, could you please provide the following information?\n\n1. Steps to reproduce the issue\n2. Browser and OS you're using\n3. Any error messages you've seen\n\nThank you!",
    category: "status",
    shortcut: "/info",
  },

  // Resolutions
  {
    id: "resolution-1",
    title: "Issue Resolved",
    body: "Great news! The issue has been resolved. Please try again and let me know if you encounter any further problems. Is there anything else I can help you with?",
    category: "resolution",
    shortcut: "/done",
  },
  {
    id: "resolution-2",
    title: "Clear Cache Fix",
    body: "This issue can often be resolved by clearing your browser cache. Please try the following:\n\n1. Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)\n2. Select 'Cached images and files'\n3. Click 'Clear data'\n4. Refresh the page\n\nLet me know if this helps!",
    category: "resolution",
    shortcut: "/cache",
  },
  {
    id: "resolution-3",
    title: "Credits Added",
    body: "I've added the credits to your account as a courtesy. The updated balance should reflect immediately. Please refresh your dashboard to see the changes.",
    category: "resolution",
    shortcut: "/credits",
  },

  // Follow-ups
  {
    id: "followup-1",
    title: "Checking In",
    body: "Hi! I wanted to check in and see if you're still experiencing the issue we discussed. Please let me know if you need any further assistance.",
    category: "followup",
    shortcut: "/check",
  },
  {
    id: "followup-2",
    title: "Closing Ticket",
    body: "Since I haven't heard back from you, I'll be closing this ticket for now. Please don't hesitate to reach out if you need any further assistance - we're always happy to help!",
    category: "followup",
    shortcut: "/close",
  },

  // Technical
  {
    id: "tech-1",
    title: "API Rate Limit",
    body: "It looks like you've hit our API rate limit. This limit resets every hour. For higher limits, please consider upgrading to our Pro or Enterprise plan, which includes increased API quotas.",
    category: "technical",
    shortcut: "/rate",
  },
  {
    id: "tech-2",
    title: "Browser Compatibility",
    body: "For the best experience with Journey Design Studio, we recommend using the latest version of Chrome, Firefox, Safari, or Edge. Some features may not work correctly on older browsers.",
    category: "technical",
    shortcut: "/browser",
  },
]

export function getCannedResponsesByCategory(category: CannedResponse["category"]) {
  return CANNED_RESPONSES.filter(r => r.category === category)
}

export function findCannedResponseByShortcut(shortcut: string) {
  return CANNED_RESPONSES.find(r => r.shortcut === shortcut)
}

export function searchCannedResponses(query: string) {
  const q = query.toLowerCase()
  return CANNED_RESPONSES.filter(r => 
    r.title.toLowerCase().includes(q) || 
    r.body.toLowerCase().includes(q) ||
    r.shortcut?.toLowerCase().includes(q)
  )
}
