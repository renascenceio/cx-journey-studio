"use server"

import { createClient } from "@/lib/supabase/server"

export async function seedDemoData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { seeded: false }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  if (!profile?.organization_id) return { seeded: false }

  const orgId = profile.organization_id
  
  // Check if journeys already exist IN THIS WORKSPACE - skip if so
  const { data: existing } = await supabase
    .from("journeys")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
  if (existing && existing.length > 0) return { seeded: false }

  // Get first team
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
    .single()
  const teamId1 = team?.id

  // Get second team if exists
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", orgId)
    .limit(2)
  const teamId2 = teams && teams.length > 1 ? teams[1].id : teamId1

  const uid = user.id

  // --- JOURNEYS ---
  const { data: j1 } = await supabase.from("journeys").insert({
    title: "E-Commerce Purchase Journey",
    description: "End-to-end customer experience from product discovery through post-purchase support.",
    type: "current", status: "in_progress", owner_id: uid, organization_id: orgId, team_id: teamId1,
    tags: ["e-commerce", "purchase", "retail"], health_status: "warning",
    last_health_check: new Date(Date.now() - 2 * 86400000).toISOString(),
  }).select("id").single()

  const { data: j2 } = await supabase.from("journeys").insert({
    title: "Omnichannel Onboarding Journey",
    description: "Future-state design for seamless onboarding spanning mobile, web, and in-store touchpoints.",
    type: "future", status: "draft", owner_id: uid, organization_id: orgId, team_id: teamId1,
    tags: ["onboarding", "omnichannel", "future-state"], health_status: "healthy",
    last_health_check: new Date(Date.now() - 86400000).toISOString(),
  }).select("id").single()

  const { data: j3 } = await supabase.from("journeys").insert({
    title: "Customer Support Resolution Journey",
    description: "Mapping the end-to-end support experience from issue identification to resolution.",
    type: "current", status: "in_progress", owner_id: uid, organization_id: orgId, team_id: teamId2,
    tags: ["support", "service", "resolution"], health_status: "critical",
    last_health_check: new Date(Date.now() - 5 * 86400000).toISOString(),
  }).select("id").single()

  if (!j1?.id || !j2?.id || !j3?.id) return { seeded: false }

  // --- COLLABORATORS ---
  await supabase.from("collaborators").insert([
    { journey_id: j1.id, user_id: uid, role: "journey_master" },
    { journey_id: j2.id, user_id: uid, role: "journey_master" },
    { journey_id: j3.id, user_id: uid, role: "journey_master" },
  ])

  // --- STAGES ---
  const stageData = [
    // Journey 1
    { journey_id: j1.id, name: "Discovery", order: 0 },
    { journey_id: j1.id, name: "Consideration", order: 1 },
    { journey_id: j1.id, name: "Purchase", order: 2 },
    { journey_id: j1.id, name: "Delivery", order: 3 },
    { journey_id: j1.id, name: "Post-Purchase", order: 4 },
    // Journey 2
    { journey_id: j2.id, name: "Awareness", order: 0 },
    { journey_id: j2.id, name: "Sign-Up", order: 1 },
    { journey_id: j2.id, name: "First Experience", order: 2 },
    { journey_id: j2.id, name: "Activation", order: 3 },
    // Journey 3
    { journey_id: j3.id, name: "Issue Identification", order: 0 },
    { journey_id: j3.id, name: "Contact & Triage", order: 1 },
    { journey_id: j3.id, name: "Resolution", order: 2 },
    { journey_id: j3.id, name: "Follow-Up", order: 3 },
  ]
  const { data: stages } = await supabase.from("stages").insert(stageData).select("id, journey_id, name")
  if (!stages) return { seeded: false }

  const s = (journeyId: string, name: string) => stages.find((st) => st.journey_id === journeyId && st.name === name)?.id

  // --- STEPS ---
  const stepData = [
    // J1 Discovery
    { stage_id: s(j1.id, "Discovery"), name: "Search & Browse", description: "Customer searches for products", order: 0 },
    { stage_id: s(j1.id, "Discovery"), name: "View Recommendations", description: "Customer sees personalized recommendations", order: 1 },
    // J1 Consideration
    { stage_id: s(j1.id, "Consideration"), name: "Compare Products", description: "Customer compares features and pricing", order: 0 },
    { stage_id: s(j1.id, "Consideration"), name: "Read Reviews", description: "Customer reads user reviews", order: 1 },
    { stage_id: s(j1.id, "Consideration"), name: "Add to Cart", description: "Customer adds items to cart", order: 2 },
    // J1 Purchase
    { stage_id: s(j1.id, "Purchase"), name: "Checkout", description: "Customer proceeds through checkout", order: 0 },
    { stage_id: s(j1.id, "Purchase"), name: "Payment", description: "Customer enters payment details", order: 1 },
    // J1 Delivery
    { stage_id: s(j1.id, "Delivery"), name: "Order Tracking", description: "Customer tracks shipment", order: 0 },
    { stage_id: s(j1.id, "Delivery"), name: "Receive Package", description: "Customer receives delivery", order: 1 },
    // J1 Post-Purchase
    { stage_id: s(j1.id, "Post-Purchase"), name: "Product Setup", description: "Customer sets up the product", order: 0 },
    { stage_id: s(j1.id, "Post-Purchase"), name: "Leave Review", description: "Customer leaves a review", order: 1 },
    // J2 Awareness
    { stage_id: s(j2.id, "Awareness"), name: "See Advertisement", description: "Prospect encounters brand via ad", order: 0 },
    { stage_id: s(j2.id, "Awareness"), name: "Visit Landing Page", description: "Prospect visits landing page", order: 1 },
    // J2 Sign-Up
    { stage_id: s(j2.id, "Sign-Up"), name: "Create Account", description: "User creates account", order: 0 },
    { stage_id: s(j2.id, "Sign-Up"), name: "Verify Email", description: "User verifies email", order: 1 },
    // J2 First Experience
    { stage_id: s(j2.id, "First Experience"), name: "Welcome Tour", description: "Guided product tour", order: 0 },
    { stage_id: s(j2.id, "First Experience"), name: "Complete First Task", description: "First meaningful action", order: 1 },
    // J2 Activation
    { stage_id: s(j2.id, "Activation"), name: "Set Preferences", description: "Customize experience", order: 0 },
    { stage_id: s(j2.id, "Activation"), name: "Invite Team", description: "Invite colleagues", order: 1 },
    // J3 Issue Identification
    { stage_id: s(j3.id, "Issue Identification"), name: "Notice Problem", description: "Customer encounters an issue", order: 0 },
    { stage_id: s(j3.id, "Issue Identification"), name: "Search Self-Help", description: "Customer searches FAQ", order: 1 },
    // J3 Contact & Triage
    { stage_id: s(j3.id, "Contact & Triage"), name: "Contact Support", description: "Customer reaches out via chat/phone", order: 0 },
    { stage_id: s(j3.id, "Contact & Triage"), name: "Explain Issue", description: "Customer describes problem", order: 1 },
    // J3 Resolution
    { stage_id: s(j3.id, "Resolution"), name: "Receive Solution", description: "Agent provides resolution", order: 0 },
    { stage_id: s(j3.id, "Resolution"), name: "Confirm Fix", description: "Customer confirms resolved", order: 1 },
    // J3 Follow-Up
    { stage_id: s(j3.id, "Follow-Up"), name: "Satisfaction Survey", description: "Follow-up survey", order: 0 },
    { stage_id: s(j3.id, "Follow-Up"), name: "Loyalty Offer", description: "Retention offer", order: 1 },
  ]
  const { data: steps } = await supabase.from("steps").insert(stepData).select("id, stage_id, name")
  if (!steps) return { seeded: false }

  const st = (stageId: string | undefined, name: string) => steps.find((sp) => sp.stage_id === stageId && sp.name === name)?.id

  // --- TOUCH POINTS ---
  const tpData = [
    { step_id: st(s(j1.id, "Discovery"), "Search & Browse"), channel: "Web", description: "Google search leading to product page", emotional_score: 2 },
    { step_id: st(s(j1.id, "Discovery"), "View Recommendations"), channel: "Web", description: "AI-powered recommendation carousel", emotional_score: 3 },
    { step_id: st(s(j1.id, "Consideration"), "Compare Products"), channel: "Web", description: "Side-by-side comparison table", emotional_score: 1 },
    { step_id: st(s(j1.id, "Consideration"), "Read Reviews"), channel: "Web", description: "Customer review section with photos", emotional_score: 2 },
    { step_id: st(s(j1.id, "Consideration"), "Add to Cart"), channel: "Web", description: "Add to cart button and mini-cart", emotional_score: 3 },
    { step_id: st(s(j1.id, "Purchase"), "Checkout"), channel: "Web", description: "Multi-step checkout form", emotional_score: -2 },
    { step_id: st(s(j1.id, "Purchase"), "Payment"), channel: "Web", description: "Payment gateway integration", emotional_score: -3 },
    { step_id: st(s(j1.id, "Delivery"), "Order Tracking"), channel: "Email", description: "Order confirmation and tracking emails", emotional_score: 2 },
    { step_id: st(s(j1.id, "Delivery"), "Order Tracking"), channel: "Mobile", description: "Push notifications for delivery updates", emotional_score: 3 },
    { step_id: st(s(j1.id, "Delivery"), "Receive Package"), channel: "Physical", description: "Unboxing experience with premium packaging", emotional_score: 5 },
    { step_id: st(s(j1.id, "Post-Purchase"), "Product Setup"), channel: "Mobile", description: "In-app setup wizard", emotional_score: 1 },
    { step_id: st(s(j1.id, "Post-Purchase"), "Leave Review"), channel: "Email", description: "Review request email", emotional_score: 0 },
    { step_id: st(s(j2.id, "Awareness"), "See Advertisement"), channel: "Social", description: "Instagram ad with signup CTA", emotional_score: 2 },
    { step_id: st(s(j2.id, "Awareness"), "Visit Landing Page"), channel: "Web", description: "Landing page with value proposition", emotional_score: 3 },
    { step_id: st(s(j2.id, "Sign-Up"), "Create Account"), channel: "Web", description: "One-click social login form", emotional_score: 4 },
    { step_id: st(s(j2.id, "Sign-Up"), "Verify Email"), channel: "Email", description: "Verification email with magic link", emotional_score: 1 },
    { step_id: st(s(j2.id, "First Experience"), "Welcome Tour"), channel: "Mobile", description: "Interactive product walkthrough", emotional_score: 4 },
    { step_id: st(s(j2.id, "First Experience"), "Complete First Task"), channel: "Web", description: "Guided first-task completion flow", emotional_score: 5 },
    { step_id: st(s(j2.id, "Activation"), "Set Preferences"), channel: "Mobile", description: "Preference selection screen", emotional_score: 2 },
    { step_id: st(s(j2.id, "Activation"), "Invite Team"), channel: "Email", description: "Team invite email", emotional_score: 3 },
    { step_id: st(s(j3.id, "Issue Identification"), "Notice Problem"), channel: "Physical", description: "Product malfunction or defect", emotional_score: -4 },
    { step_id: st(s(j3.id, "Issue Identification"), "Search Self-Help"), channel: "Web", description: "Knowledge base search results", emotional_score: -1 },
    { step_id: st(s(j3.id, "Contact & Triage"), "Contact Support"), channel: "Chat", description: "Live chat widget with queue time", emotional_score: -3 },
    { step_id: st(s(j3.id, "Contact & Triage"), "Contact Support"), channel: "Phone", description: "IVR menu then hold music", emotional_score: -5 },
    { step_id: st(s(j3.id, "Resolution"), "Receive Solution"), channel: "Chat", description: "Agent provides step-by-step guide", emotional_score: 3 },
    { step_id: st(s(j3.id, "Resolution"), "Confirm Fix"), channel: "Chat", description: "Customer confirms issue resolved", emotional_score: 4 },
    { step_id: st(s(j3.id, "Follow-Up"), "Satisfaction Survey"), channel: "Email", description: "CSAT survey email", emotional_score: 1 },
    { step_id: st(s(j3.id, "Follow-Up"), "Loyalty Offer"), channel: "Email", description: "Discount code for next purchase", emotional_score: 2 },
  ]
  await supabase.from("touch_points").insert(tpData)

  // --- ARCHETYPES ---
  await supabase.from("archetypes").insert([
    {
      journey_id: j1.id, name: "Sarah Chen", role: "Tech-Savvy Shopper",
      subtitle: "Expects fast, seamless digital experiences", category: "e-commerce",
      description: "A digital native who shops primarily on mobile and expects Amazon-level convenience.",
      goals_narrative: "Wants to find deals quickly and checkout seamlessly",
      needs_narrative: "Needs clear pricing and fast delivery",
      touchpoints_narrative: "Prefers mobile and web touchpoints",
      goals: ["Find best deals quickly", "Seamless mobile checkout", "Fast delivery"],
      frustrations: ["Slow page loads", "Complex checkout forms", "Unclear return policies"],
      behaviors: ["Compares prices across platforms", "Reads reviews before buying", "Prefers mobile shopping"],
      expectations: ["One-click checkout", "Same-day delivery", "Easy returns"],
      barriers: ["Complicated registration forms", "Lack of payment options"],
      drivers: ["Price savings", "Convenience", "Social proof"],
      important_steps: ["Search & Browse", "Add to Cart", "Checkout"],
      triggers: ["Need for a specific product", "Sale notification"],
      mindset: ["Efficiency-focused", "Deal-seeking", "Mobile-first"],
      solution_principles: ["Simplify checkout", "Add mobile payment options"],
      value_metric: "Conversion rate", base_percentage: "42%", tags: ["mobile", "digital-native"],
    },
    {
      journey_id: j1.id, name: "James Morrison", role: "Cautious Buyer",
      subtitle: "Needs reassurance before committing", category: "e-commerce",
      description: "A methodical shopper who researches extensively before making purchase decisions.",
      goals_narrative: "Wants thorough information and low-risk purchases",
      needs_narrative: "Needs clear return policies and responsive support",
      touchpoints_narrative: "Prefers desktop web and phone support",
      goals: ["Thorough product research", "Clear return policy", "Reliable customer service"],
      frustrations: ["Pressure to buy quickly", "Hidden fees at checkout", "Poor product descriptions"],
      behaviors: ["Reads multiple reviews", "Contacts support before buying", "Prefers desktop browsing"],
      expectations: ["Detailed product specs", "Easy access to support", "Transparent pricing"],
      barriers: ["Time pressure tactics", "Information overload"],
      drivers: ["Trust", "Security", "Value for money"],
      important_steps: ["Compare Products", "Read Reviews", "Payment"],
      triggers: ["Recommendation from friend", "Seasonal need"],
      mindset: ["Risk-averse", "Research-driven", "Quality-focused"],
      solution_principles: ["Add comparison tools", "Improve product descriptions"],
      value_metric: "Average order value", base_percentage: "28%", tags: ["desktop", "research-oriented"],
    },
    {
      journey_id: j3.id, name: "Maria Lopez", role: "Frustrated Customer",
      subtitle: "Wants fast empathetic resolution", category: "e-commerce",
      description: "An existing customer who is already upset and needs swift, empathetic support resolution.",
      goals_narrative: "Wants quick resolution without repeating information",
      needs_narrative: "Needs to feel heard and valued by support",
      touchpoints_narrative: "Prefers chat and phone touchpoints",
      goals: ["Quick issue resolution", "Not repeat information", "Feel heard and valued"],
      frustrations: ["Long hold times", "Being transferred repeatedly", "Scripted responses"],
      behaviors: ["Tries self-service first", "Prefers chat over phone", "Will escalate if unresolved"],
      expectations: ["Under 5 min resolution", "Single agent handling", "Personalized response"],
      barriers: ["Complex IVR menus", "Agent knowledge gaps"],
      drivers: ["Past positive experiences", "Product dependency"],
      important_steps: ["Search Self-Help", "Contact Support", "Confirm Fix"],
      triggers: ["Product failure", "Billing error", "Service outage"],
      mindset: ["Impatient", "Seeking empathy", "Loyalty-conditional"],
      solution_principles: ["Reduce hold times", "Implement smart routing"],
      value_metric: "First contact resolution rate", base_percentage: "30%", tags: ["support", "retention"],
    },
  ])

  // --- ACTIVITY LOG ---
  await supabase.from("activity_log").insert([
    { action: "created", actor_id: uid, journey_id: j1.id, details: "Created E-Commerce Purchase Journey", timestamp: new Date(Date.now() - 30 * 86400000).toISOString() },
    { action: "edited", actor_id: uid, journey_id: j1.id, details: "Added 5 stages to the journey", stage_id: s(j1.id, "Discovery"), timestamp: new Date(Date.now() - 29 * 86400000).toISOString() },
    { action: "edited", actor_id: uid, journey_id: j1.id, details: "Added touch points across all stages", timestamp: new Date(Date.now() - 28 * 86400000).toISOString() },
    { action: "commented", actor_id: uid, journey_id: j1.id, details: "Commented on checkout friction", comment_preview: "The checkout flow needs serious work...", timestamp: new Date(Date.now() - 20 * 86400000).toISOString() },
    { action: "created", actor_id: uid, journey_id: j2.id, details: "Created Omnichannel Onboarding Journey", timestamp: new Date(Date.now() - 14 * 86400000).toISOString() },
    { action: "status_changed", actor_id: uid, journey_id: j1.id, details: "Health check flagged checkout as warning", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { action: "created", actor_id: uid, journey_id: j3.id, details: "Created Customer Support Resolution Journey", timestamp: new Date(Date.now() - 45 * 86400000).toISOString() },
    { action: "edited", actor_id: uid, journey_id: j3.id, details: "Reordered support journey stages", timestamp: new Date(Date.now() - 10 * 86400000).toISOString() },
  ])

  // --- COMMENTS ---
  await supabase.from("comments").insert([
    { journey_id: j1.id, content: "The checkout flow has a 68% drop-off rate at payment. We need to simplify the form.", author_id: uid, mentions: [], resolved: false, stage_id: s(j1.id, "Purchase"), step_id: st(s(j1.id, "Purchase"), "Payment"), reactions: [] },
    { journey_id: j1.id, content: "The unboxing experience is our strongest touchpoint. Customers love the premium packaging.", author_id: uid, mentions: [], resolved: true, stage_id: s(j1.id, "Delivery"), reactions: [] },
    { journey_id: j3.id, content: "Average hold time is 12 minutes. This is driving negative NPS scores.", author_id: uid, mentions: [], resolved: false, stage_id: s(j3.id, "Contact & Triage"), step_id: st(s(j3.id, "Contact & Triage"), "Contact Support"), reactions: [] },
  ])

  // --- JOURNEY VERSION ---
  await supabase.from("journey_versions").insert({
    journey_id: j1.id, version_number: 1, label: "Initial Mapping",
    snapshot: { title: "E-Commerce Purchase Journey", stages: 5, steps: 11, touchpoints: 12 },
    created_by: uid, changes_summary: "Initial journey mapping with all stages, steps, and touchpoints defined.",
  })

  return { seeded: true }
}
