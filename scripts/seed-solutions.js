import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedSolutions() {
  // Check if solutions exist
  const { count } = await supabase
    .from("solutions")
    .select("id", { count: "exact", head: true });

  if (count > 0) {
    console.log(`Solutions already exist (${count}), skipping`);
    return;
  }

  const solutions = [
    { title: "Proactive Chat Triggers", category: "technological", description: "Deploy context-aware chat triggers based on user behavior signals like hesitation or cart inactivity.", source: "Forrester Research 2025", tags: ["chat", "engagement", "conversion"], relevance: 92, upvotes: 47, is_crowd: false },
    { title: "Emotional Journey Mapping", category: "behavioral", description: "Overlay emotional valence data onto journey stages using micro-surveys and facial coding analysis.", source: "Harvard Business Review", tags: ["emotion", "mapping", "research"], relevance: 88, upvotes: 38, is_crowd: false },
    { title: "Service Recovery Rituals", category: "rituals", description: "Structured service recovery protocols that turn negative experiences into loyalty-building moments.", source: "CX Professionals Assoc.", tags: ["service-recovery", "loyalty", "retention"], relevance: 85, upvotes: 52, is_crowd: false },
    { title: "Omnichannel Handoff Protocol", category: "industrial", description: "Seamless transition protocols between digital and physical touchpoints with context-passing standards.", source: "McKinsey Digital", tags: ["omnichannel", "handoff", "continuity"], relevance: 82, upvotes: 29, is_crowd: false },
    { title: "Social Proof Micro-Moments", category: "social", description: "Inject contextual social proof at key decision points. Most effective at consideration and purchase stages.", source: "Behavioral Science Lab", tags: ["social-proof", "conversion", "trust"], relevance: 79, upvotes: 41, is_crowd: false },
    { title: "Sustainable Packaging Journey", category: "environmental", description: "Re-engineer the unboxing experience to minimize waste while maximizing delight.", source: "GreenBiz Insights", tags: ["sustainability", "packaging", "eco"], relevance: 75, upvotes: 33, is_crowd: false },
    { title: "AI-Powered Next Best Action", category: "technological", description: "ML models trained on journey data recommend optimal next interactions. 23% average conversion lift.", source: "Gartner CX Report", tags: ["ai", "ml", "personalization"], relevance: 91, upvotes: 61, is_crowd: false },
    { title: "Habit Loop Design", category: "behavioral", description: "Apply Cue-Routine-Reward framework to design sticky product experiences.", source: "Nir Eyal / Hooked", tags: ["habits", "engagement", "retention"], relevance: 86, upvotes: 44, is_crowd: false },
    { title: "Zero-Friction Onboarding", category: "industrial", description: "Progressive disclosure onboarding adapting to user proficiency. Eliminates mandatory tutorials.", source: "Product-Led Growth Institute", tags: ["onboarding", "plg", "activation"], relevance: 90, upvotes: 55, is_crowd: false },
    { title: "Community Co-Creation Loops", category: "social", description: "Feedback loops where customers actively participate in journey improvement.", source: "IDEO Design Thinking", tags: ["community", "co-creation", "feedback"], relevance: 77, upvotes: 28, is_crowd: false },
    { title: "Wait Time Transparency Board", category: "rituals", description: "Digital displays with real-time wait estimates reduced perceived wait time by 40%.", source: "Crowd Contribution", tags: ["wait-time", "transparency", "retail"], relevance: 73, upvotes: 19, is_crowd: true, industry: "Retail", contributor_org: "Nordstrom CX Team" },
    { title: "Empathy-First Escalation", category: "behavioral", description: "Retrained support team to lead with emotional acknowledgment. CSAT improved 18 points.", source: "Crowd Contribution", tags: ["empathy", "support", "escalation"], relevance: 80, upvotes: 35, is_crowd: true, industry: "SaaS", contributor_org: "Zendesk Community" },
    { title: "QR Feedback Tokens", category: "technological", description: "Physical QR tokens at checkout linking to feedback form. 4x higher response rate.", source: "Crowd Contribution", tags: ["feedback", "qr", "survey"], relevance: 71, upvotes: 22, is_crowd: true, industry: "Hospitality", contributor_org: "Marriott Innovation Lab" },
    { title: "Cross-Dept Journey Councils", category: "industrial", description: "Monthly cross-functional councils reviewing journey health. Broke silo problem in one quarter.", source: "Crowd Contribution", tags: ["collaboration", "cross-functional", "governance"], relevance: 76, upvotes: 31, is_crowd: true, industry: "Enterprise", contributor_org: "Salesforce CX Ops" },
    { title: "Green Points Loyalty Tier", category: "environmental", description: "Sustainability-linked loyalty tier rewarding eco-friendly choices. 28% opt-in in first month.", source: "Crowd Contribution", tags: ["loyalty", "sustainability", "rewards"], relevance: 68, upvotes: 17, is_crowd: true, industry: "Retail", contributor_org: "Patagonia Community" },
    { title: "Peer Support Networks", category: "social", description: "Customer-to-customer support forums. Resolved 35% of tickets without agent involvement.", source: "Crowd Contribution", tags: ["community", "peer-support", "self-service"], relevance: 74, upvotes: 26, is_crowd: true, industry: "SaaS", contributor_org: "Atlassian Community" },
  ];

  const { error } = await supabase.from("solutions").insert(solutions);
  if (error) {
    console.error("Failed to seed solutions:", error.message);
  } else {
    console.log(`Seeded ${solutions.length} solutions successfully`);
  }
}

async function seedDeployedJourney() {
  // Check if deployed journey exists
  const { data: existing } = await supabase
    .from("journeys")
    .select("id")
    .eq("type", "deployed")
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Deployed journey already exists, skipping");
    return;
  }

  // Get first user, org, and team
  const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
  const { data: teams } = await supabase.from("teams").select("id").limit(1);

  if (!users?.length || !orgs?.length || !teams?.length) {
    console.log("Missing data for journey seed. Users:", users?.length, "Orgs:", orgs?.length, "Teams:", teams?.length);
    return;
  }

  const ownerId = users[0].id;
  const orgId = orgs[0].id;
  const teamId = teams[0].id;
  console.log("Using user:", ownerId, "org:", orgId, "team:", teamId);

  // Create journey
  const { data: journey, error: jErr } = await supabase
    .from("journeys")
    .insert({ title: "E-Commerce Purchase Flow (Live)", type: "deployed", status: "deployed", description: "Currently deployed customer purchase journey, live since Q3 2025.", owner_id: ownerId, organization_id: orgId, team_id: teamId })
    .select("id")
    .single();

  if (jErr) { console.error("Journey error:", jErr.message); return; }

  const stages = [
    { journey_id: journey.id, name: "Discovery", order: 0 },
    { journey_id: journey.id, name: "Consideration", order: 1 },
    { journey_id: journey.id, name: "Purchase", order: 2 },
  ];

  const { data: stageRows, error: sErr } = await supabase.from("stages").insert(stages).select("id, name");
  if (sErr) { console.error("Stages error:", sErr.message); return; }

  const stageMap = {};
  for (const s of stageRows) stageMap[s.name] = s.id;

  const steps = [
    { stage_id: stageMap["Discovery"], name: "Search & Browse", description: "Customer searches via organic search or paid ads", order: 0 },
    { stage_id: stageMap["Consideration"], name: "Compare Options", description: "Customer compares products and reads reviews", order: 0 },
    { stage_id: stageMap["Purchase"], name: "Checkout & Payment", description: "Customer completes cart and confirms order", order: 0 },
  ];

  const { data: stepRows, error: stErr } = await supabase.from("steps").insert(steps).select("id, name");
  if (stErr) { console.error("Steps error:", stErr.message); return; }

  const stepMap = {};
  for (const s of stepRows) stepMap[s.name] = s.id;

  const touchpoints = [
    { step_id: stepMap["Search & Browse"], channel: "Web", description: "Product listing page with filters", emotional_score: 3 },
    { step_id: stepMap["Search & Browse"], channel: "Mobile App", description: "Mobile-optimized browse experience", emotional_score: 2 },
    { step_id: stepMap["Compare Options"], channel: "Web", description: "Product detail page with reviews", emotional_score: 1 },
    { step_id: stepMap["Compare Options"], channel: "Email", description: "Abandoned browse recovery email", emotional_score: -1 },
    { step_id: stepMap["Checkout & Payment"], channel: "Web", description: "One-page checkout with saved payment", emotional_score: 4 },
    { step_id: stepMap["Checkout & Payment"], channel: "SMS", description: "Order confirmation and tracking", emotional_score: 3 },
  ];

  const { error: tpErr } = await supabase.from("touch_points").insert(touchpoints);
  if (tpErr) { console.error("Touchpoints error:", tpErr.message); return; }

  console.log("Seeded deployed journey with 3 stages, 3 steps, 6 touchpoints");
}

await seedSolutions();
await seedDeployedJourney();
console.log("Done!");
