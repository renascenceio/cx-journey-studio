import type {
  Organization,
  Team,
  User,
  Journey,
  Archetype,
  Stage,
  Step,
  TouchPoint,
  ActivityLogEntry,
  Notification,
  DashboardStats,
  Comment,
  HealthIndicator,
  Opportunity,
  GapAnalysisEntry,
  Solution,
  SolutionCategory,
} from "./types"

// ========================
// Organization & Users
// ========================

export const organization: Organization = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "pro",
  teamIds: ["team-1", "team-2"],
  createdAt: "2024-06-01T00:00:00Z",
}

export const teams: Team[] = [
  {
    id: "team-1",
    name: "CX Design",
    description: "Customer Experience Design and Research",
    organizationId: "org-1",
    memberIds: ["user-1", "user-2", "user-3"],
    createdAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "team-2",
    name: "Product",
    description: "Product Management and Strategy",
    organizationId: "org-1",
    memberIds: ["user-1", "user-4"],
    createdAt: "2024-07-15T00:00:00Z",
  },
]

export const currentUser: User = {
  id: "user-1",
  name: "Alex Morgan",
  email: "alex@acmecorp.com",
  role: "journey_master",
  teamIds: ["team-1", "team-2"],
  organizationId: "org-1",
  createdAt: "2024-06-01T00:00:00Z",
}

export const users: User[] = [
  currentUser,
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@acmecorp.com",
    role: "contributor",
    teamIds: ["team-1"],
    organizationId: "org-1",
    createdAt: "2024-06-10T00:00:00Z",
  },
  {
    id: "user-3",
    name: "James Wilson",
    email: "james@acmecorp.com",
    role: "viewer",
    teamIds: ["team-1"],
    organizationId: "org-1",
    createdAt: "2024-07-01T00:00:00Z",
  },
  {
    id: "user-4",
    name: "Priya Patel",
    email: "priya@acmecorp.com",
    role: "contributor",
    teamIds: ["team-2"],
    organizationId: "org-1",
    createdAt: "2024-08-01T00:00:00Z",
  },
]

// ========================
// Archetypes
// ========================

export const archetypes: Record<string, Archetype> = {
  onlineShopper: {
    id: "archetype-1",
    name: "Smart & Savvy",
    role: "Online Shopper",
    subtitle: "Carpe Pretium (Seize the Deal)",
    category: "e-commerce",
    description: "I lead a busy professional life and value my time above all. Shopping online is not just convenience, it is how I reclaim hours in my week. I research thoroughly, compare options, and expect the checkout to be as frictionless as the product discovery.",
    goalsNarrative: "My goal is to find the best product at the best price with the least effort. I want accurate delivery dates, transparent pricing, and the confidence that returns will be hassle-free if something does not work out.",
    needsNarrative: "To reach that goal, I compare prices across multiple tabs, read detailed reviews, and look for verified purchase badges. I need filtering that actually works, size guides I can trust, and a cart that remembers where I left off.",
    touchpointsNarrative: "Search engines, Instagram ads, brand websites, comparison aggregators, and mobile apps are my primary channels. I trust peer reviews more than brand copy, and I rely on email order confirmations as my paper trail.",
    goals: ["Find products quickly", "Get accurate delivery estimates", "Easy checkout process", "Transparent total pricing"],
    frustrations: ["Complicated return processes", "Unexpected shipping costs", "Slow page load times", "Out-of-stock after adding to cart"],
    behaviors: ["Compares prices across tabs", "Reads reviews before purchasing", "Shops primarily on mobile during commute", "Uses wishlist as a decision tool"],
    expectations: ["Fast page loads", "Accurate inventory", "Clear return policy", "Multiple payment options"],
    barriers: ["Hidden fees at checkout", "Forced account creation", "Complex size/fit guides", "Slow customer service"],
    drivers: ["Free shipping thresholds", "Flash sales and urgency", "Loyalty rewards", "Social proof and ratings"],
    importantSteps: ["Product discovery", "Comparison and filtering", "Cart review", "Checkout and payment"],
    triggers: ["Seasonal sales", "Low stock alerts", "Personalized recommendations", "Abandoned cart emails"],
    mindset: ["Analytical", "Deal-seeking", "Impatient", "Quality-conscious"],
    solutionPrinciples: [
      "Because they research extensively, the experience must be transparent and data-rich, with real-time inventory and honest reviews.",
      "Because they are time-poor, the checkout must be frictionless with saved preferences, one-click ordering, and instant confirmations.",
      "Because they compare across competitors, the experience must emphasize unique value through loyalty perks, price-match guarantees, and exclusive content.",
    ],
    valueMetric: "2.4B",
    basePercentage: "34%",
    pillarRatings: [
      { name: "Recognition", score: 6, group: "higher_order" },
      { name: "Integrity", score: 8, group: "higher_order" },
      { name: "Expectations", score: 9, group: "higher_order" },
      { name: "Empathy", score: 5, group: "higher_order" },
      { name: "Emotions", score: 4, group: "higher_order" },
      { name: "Resolution", score: 7, group: "basic_order" },
      { name: "Speed", score: 9, group: "basic_order" },
      { name: "Effort", score: 8, group: "basic_order" },
      { name: "Enablement", score: 6, group: "basic_order" },
      { name: "Convenience", score: 10, group: "basic_order" },
    ],
    radarCharts: [
      {
        label: "Values",
        dimensions: [
          { axis: "Price", value: 90 }, { axis: "Speed", value: 85 }, { axis: "Quality", value: 70 },
          { axis: "Trust", value: 65 }, { axis: "Convenience", value: 95 }, { axis: "Selection", value: 80 },
        ],
      },
      {
        label: "Channels",
        dimensions: [
          { axis: "Mobile App", value: 90 }, { axis: "Website", value: 75 }, { axis: "Social", value: 60 },
          { axis: "Email", value: 50 }, { axis: "In-Store", value: 20 }, { axis: "Search", value: 85 },
        ],
      },
    ],
    tags: ["e-commerce", "retail", "mobile-first", "deal-seeker"],
  },
  newCustomer: {
    id: "archetype-2",
    name: "Fresh Start",
    role: "New Banking Customer",
    subtitle: "Initium Novum (A New Beginning)",
    category: "banking",
    description: "I recently relocated and need to rebuild my financial infrastructure from scratch. I am cautious about digital banking because I have never used it as my primary channel. Trust and guidance are paramount.",
    goalsNarrative: "I want to open a fully functional account in under 15 minutes without visiting a branch. I need to understand what services are available and get recommendations tailored to someone starting fresh.",
    needsNarrative: "I spend time on forums and comparison sites before committing. I need clear progress indicators during onboarding, jargon-free communication, and reassurance that my data is secure at every step.",
    touchpointsNarrative: "Bank comparison websites, Reddit finance communities, the bank mobile app, branch visits for complex queries, and customer support chat are my main channels.",
    goals: ["Open an account quickly", "Understand available services", "Get personalized recommendations", "Feel secure with my data"],
    frustrations: ["Too many form fields", "Lack of progress indicators", "Jargon-heavy communication", "No human fallback option"],
    behaviors: ["Researches on forums before signing up", "Prefers chat over phone support", "Expects mobile app parity with web", "Screenshots terms and conditions"],
    expectations: ["Quick onboarding", "Clear language", "Progress visibility", "Data security assurance"],
    barriers: ["Identity verification friction", "Unclear fee structures", "No branch nearby", "Complex product bundles"],
    drivers: ["Welcome bonuses", "Referral from friends", "Good app store ratings", "Transparent fee structure"],
    importantSteps: ["Research and comparison", "Application start", "Identity verification", "First transaction"],
    triggers: ["Relocation", "Life event (marriage, job)", "Dissatisfaction with current bank", "Peer recommendation"],
    mindset: ["Cautious", "Research-driven", "Optimistic", "Value-seeking"],
    solutionPrinciples: [
      "Because they are new and uncertain, the experience must be guided and supportive, with clear next steps and contextual help at every stage.",
      "Because they research extensively, transparent pricing and real customer testimonials must be front and center.",
      "Because they are digitally cautious, security signals and human fallback options must be prominent and reassuring.",
    ],
    valueMetric: "890M",
    basePercentage: "22%",
    pillarRatings: [
      { name: "Recognition", score: 4, group: "higher_order" },
      { name: "Integrity", score: 9, group: "higher_order" },
      { name: "Expectations", score: 7, group: "higher_order" },
      { name: "Empathy", score: 8, group: "higher_order" },
      { name: "Emotions", score: 6, group: "higher_order" },
      { name: "Resolution", score: 5, group: "basic_order" },
      { name: "Speed", score: 7, group: "basic_order" },
      { name: "Effort", score: 6, group: "basic_order" },
      { name: "Enablement", score: 8, group: "basic_order" },
      { name: "Convenience", score: 7, group: "basic_order" },
    ],
    radarCharts: [
      {
        label: "Needs",
        dimensions: [
          { axis: "Guidance", value: 95 }, { axis: "Security", value: 90 }, { axis: "Simplicity", value: 85 },
          { axis: "Speed", value: 60 }, { axis: "Personalization", value: 50 }, { axis: "Transparency", value: 88 },
        ],
      },
      {
        label: "Channels",
        dimensions: [
          { axis: "Mobile App", value: 70 }, { axis: "Website", value: 80 }, { axis: "Branch", value: 40 },
          { axis: "Chat", value: 85 }, { axis: "Forums", value: 75 }, { axis: "Email", value: 55 },
        ],
      },
    ],
    tags: ["fintech", "banking", "onboarding", "trust-seeking"],
  },
  patientUser: {
    id: "archetype-3",
    name: "Steady & Strong",
    role: "Healthcare Patient",
    subtitle: "Valetudo Prima (Health Comes First)",
    category: "healthcare",
    description: "I am 55 and managing a chronic condition that requires regular interaction with healthcare services. Technology is not my first instinct but I recognize its potential to simplify my healthcare routine if designed accessibly.",
    goalsNarrative: "I want to manage my appointments, access my medical records, and communicate with my care team without feeling overwhelmed. I want to feel in control of my health journey.",
    needsNarrative: "I need large, clear interfaces, straightforward navigation, and the ability to involve my family in managing my care. I need my health data in one place, not scattered across portals.",
    touchpointsNarrative: "Phone calls to the clinic, the patient portal on desktop, pharmacy apps, printed materials from my doctor, and family members who help me navigate digital tools.",
    goals: ["Book appointments easily", "Access medical records", "Communicate with care team", "Involve family in care management"],
    frustrations: ["Long hold times on phone", "Fragmented health records", "Confusing insurance information", "Small text and complex navigation"],
    behaviors: ["Calls clinic before using app", "Relies on family for tech help", "Prefers larger font sizes and clear layouts", "Prints important health documents"],
    expectations: ["Accessible design", "Unified health records", "Easy appointment booking", "Family access controls"],
    barriers: ["Digital literacy gaps", "Multiple provider portals", "Insurance complexity", "Privacy concerns with family access"],
    drivers: ["Fewer clinic visits", "Medication reminders", "Doctor recommendation", "Family encouragement"],
    importantSteps: ["Appointment scheduling", "Pre-visit preparation", "Consultation", "Follow-up and medication management"],
    triggers: ["Symptom changes", "Prescription refill needed", "Annual check-up reminder", "Insurance renewal"],
    mindset: ["Cautious", "Dependent on routine", "Family-oriented", "Resilient"],
    solutionPrinciples: [
      "Because they have accessibility needs, the experience must be designed with large touch targets, high contrast, and clear hierarchy that works for all abilities.",
      "Because they rely on family, the experience must support delegated access and shared care management without compromising privacy.",
      "Because their health data is fragmented, the experience must aggregate records into a single, trustworthy view that reduces cognitive load.",
    ],
    valueMetric: "1.2B",
    basePercentage: "18%",
    pillarRatings: [
      { name: "Recognition", score: 5, group: "higher_order" },
      { name: "Integrity", score: 9, group: "higher_order" },
      { name: "Expectations", score: 6, group: "higher_order" },
      { name: "Empathy", score: 10, group: "higher_order" },
      { name: "Emotions", score: 8, group: "higher_order" },
      { name: "Resolution", score: 8, group: "basic_order" },
      { name: "Speed", score: 5, group: "basic_order" },
      { name: "Effort", score: 4, group: "basic_order" },
      { name: "Enablement", score: 9, group: "basic_order" },
      { name: "Convenience", score: 7, group: "basic_order" },
    ],
    radarCharts: [
      {
        label: "Care Priorities",
        dimensions: [
          { axis: "Accessibility", value: 95 }, { axis: "Trust", value: 90 }, { axis: "Simplicity", value: 92 },
          { axis: "Family", value: 88 }, { axis: "Continuity", value: 85 }, { axis: "Speed", value: 40 },
        ],
      },
      {
        label: "Channels",
        dimensions: [
          { axis: "Phone", value: 90 }, { axis: "Portal", value: 55 }, { axis: "In-Person", value: 80 },
          { axis: "Family Proxy", value: 75 }, { axis: "Pharmacy App", value: 45 }, { axis: "Print", value: 70 },
        ],
      },
    ],
    tags: ["healthcare", "accessibility", "chronic-care", "family-care"],
  },
  cxManager: {
    id: "archetype-4",
    name: "The Orchestrator",
    role: "CX Program Manager",
    subtitle: "Omnia Videt (Sees Everything)",
    category: "saas",
    description: "I am 40 and have spent a decade in customer experience. I manage journey programs across multiple teams and need a single source of truth to identify what is working, what is broken, and where to invest next.",
    goalsNarrative: "I want a holistic, real-time view of all active journeys so I can prioritize improvements, justify budgets to leadership, and celebrate wins with my teams.",
    needsNarrative: "I need dashboards that update in real-time, comparison views across journeys, exportable reports, and the ability to drill down from a high-level metric to a specific touch point in three clicks.",
    touchpointsNarrative: "The CX studio dashboard, Slack notifications for health alerts, weekly leadership decks, team standup screens, and email digests of journey changes.",
    goals: ["Get a holistic view of all journeys", "Identify underperforming touch points", "Report to leadership with data", "Align teams around CX priorities"],
    frustrations: ["Siloed journey data across teams", "No single source of truth", "Manual reporting processes", "Inconsistent metrics definitions"],
    behaviors: ["Checks dashboards every morning", "Shares journey insights in weekly syncs", "Champions data-driven CX improvements", "Creates journey scorecards monthly"],
    expectations: ["Real-time data", "Cross-journey comparison", "Exportable reports", "Role-based views"],
    barriers: ["Data silos between departments", "Lack of executive buy-in", "Tool fragmentation", "Inconsistent data quality"],
    drivers: ["NPS improvements", "Customer retention metrics", "Competitive pressure", "Board-level CX mandate"],
    importantSteps: ["Morning dashboard review", "Weekly team alignment", "Monthly leadership report", "Quarterly strategy refresh"],
    triggers: ["Health alert on deployed journey", "NPS score drop", "New competitor launch", "Quarterly planning cycle"],
    mindset: ["Strategic", "Data-driven", "Collaborative", "Results-oriented"],
    solutionPrinciples: [
      "Because they manage many journeys, the experience must provide clear hierarchy with progressive disclosure from portfolio to individual touch point.",
      "Because they report to leadership, every insight must be exportable and presentable with minimal reformatting.",
      "Because they coordinate teams, collaboration features like comments, mentions, and activity feeds are not nice-to-haves but core workflow.",
    ],
    valueMetric: "N/A",
    basePercentage: "N/A",
    pillarRatings: [
      { name: "Recognition", score: 7, group: "higher_order" },
      { name: "Integrity", score: 8, group: "higher_order" },
      { name: "Expectations", score: 9, group: "higher_order" },
      { name: "Empathy", score: 6, group: "higher_order" },
      { name: "Emotions", score: 5, group: "higher_order" },
      { name: "Resolution", score: 9, group: "basic_order" },
      { name: "Speed", score: 8, group: "basic_order" },
      { name: "Effort", score: 7, group: "basic_order" },
      { name: "Enablement", score: 10, group: "basic_order" },
      { name: "Convenience", score: 8, group: "basic_order" },
    ],
    radarCharts: [
      {
        label: "Work Priorities",
        dimensions: [
          { axis: "Visibility", value: 95 }, { axis: "Speed", value: 80 }, { axis: "Accuracy", value: 90 },
          { axis: "Collaboration", value: 85 }, { axis: "Reporting", value: 92 }, { axis: "Flexibility", value: 70 },
        ],
      },
    ],
    tags: ["management", "analytics", "strategy", "cross-functional"],
  },
  budgetApprover: {
    id: "archetype-5",
    name: "Home, Sweet Home",
    role: "Property Buyer",
    subtitle: "Familia Ante Omnia (Family Over All)",
    category: "real_estate",
    description: "I lead a busy life and one of my key priorities is to take care of my family and its multiple needs. A property purchase is going to provide security, protection and comfort my family deserves. It is a one shot and I need to be reassured that it will secure my family's future financially, protect its privacy.",
    goalsNarrative: "Hence, my goal is to find a home for every family member that will not just be a place to live, but a reward and recognition for us as a family, with a personal touch for every member. Something that will highlight our individualities.",
    needsNarrative: "To reach that goal, I am doing a lot of research, exploration and deal-hunting, for which I need guidance and content. I want to learn more about smart ways of maintaining a better work-life balance for myself and for my family, and property and personalisation options are as important as the community I will be buying in.",
    touchpointsNarrative: "Friends, agents that I trust, social media and online search are important channels. But even more so it is the opportunity to touch and feel what my future home will look like. I do not want to be rushed, good choice take time, I want to be perceived as the one who makes the decision.",
    goals: ["Find a family home", "Secure financial future", "Personal touch for each member", "Community that fits"],
    frustrations: ["Rushed sales processes", "Lack of personalisation", "Hidden costs", "Unclear community information"],
    behaviors: ["Researches extensively online", "Visits showrooms multiple times", "Involves entire family in decisions", "Compares communities and amenities"],
    expectations: ["Time management", "Availability", "Clarity on costs", "Location / distance"],
    barriers: ["Move-in data", "Availability", "Price", "Location / distance", "Payment options"],
    drivers: ["Family", "Distance / Convenience", "Content", "Community"],
    importantSteps: ["First MOT - Research", "Financing", "Contract Signing", "Living"],
    triggers: ["Family Security", "Space", "Financial Security"],
    mindset: ["Challenging", "Submissive", "Caring", "Insecure", "Proactive"],
    solutionPrinciples: [
      "Because they need guidance and content to make every family member happy, the experience must be guided, but full of opportunities for personalisation.",
      "Because they need a secure way to finalize the transaction to avoid putting financials at risk, the experience has to be reassuring and risk-free.",
      "Because they need inspiration on how to organize their future home to fulfill the family dreams, the experience has to be adventurous, creating opportunities to discover and try new things.",
    ],
    valueMetric: "50B",
    basePercentage: "50%",
    pillarRatings: [
      { name: "Recognition", score: 3, group: "higher_order" },
      { name: "Integrity", score: 10, group: "higher_order" },
      { name: "Expectations", score: 8, group: "higher_order" },
      { name: "Empathy", score: 4, group: "higher_order" },
      { name: "Emotions", score: 3, group: "higher_order" },
      { name: "Resolution", score: 9, group: "basic_order" },
      { name: "Speed", score: 6, group: "basic_order" },
      { name: "Effort", score: 5, group: "basic_order" },
      { name: "Enablement", score: 7, group: "basic_order" },
      { name: "Convenience", score: 6, group: "basic_order" },
    ],
    radarCharts: [
      {
        label: "Values",
        dimensions: [
          { axis: "Recognition", value: 75 }, { axis: "New Image", value: 60 }, { axis: "Future Growth", value: 55 },
          { axis: "New Lifestyle", value: 65 }, { axis: "Family Place", value: 90 },
        ],
      },
      {
        label: "Information Sources",
        dimensions: [
          { axis: "Online Search", value: 85 }, { axis: "Showrooms", value: 80 }, { axis: "Developer Website", value: 55 },
          { axis: "Broker Website", value: 45 }, { axis: "Social Media", value: 70 }, { axis: "Aggregators", value: 60 },
          { axis: "Community Website", value: 50 }, { axis: "Family & Friends", value: 90 },
        ],
      },
      {
        label: "Needs",
        dimensions: [
          { axis: "Information", value: 75 }, { axis: "Content & Inspiration", value: 60 }, { axis: "Offers & Price", value: 70 },
          { axis: "Payment Options", value: 65 }, { axis: "Guidance & Advice", value: 80 }, { axis: "Enablement & Tools", value: 50 },
          { axis: "Risks & Reassurance", value: 85 }, { axis: "Service & Support", value: 70 },
        ],
      },
    ],
    tags: ["real-estate", "property", "family", "home-buyer"],
  },
}

// ========================
// Rich Touch Point Builder
// ========================

function tp(
  id: string,
  channel: string,
  description: string,
  score: number,
  painPoints: { desc: string; severity: "low" | "medium" | "high" | "critical" }[] = [],
  highlights: { desc: string; impact: "low" | "medium" | "high" }[] = []
): TouchPoint {
  return {
    id,
    channel,
    description,
    emotionalScore: score,
    painPoints: painPoints.map((pp, i) => ({
      id: `${id}-pp-${i}`,
      description: pp.desc,
      severity: pp.severity,
    })),
    highlights: highlights.map((hl, i) => ({
      id: `${id}-hl-${i}`,
      description: hl.desc,
      impact: hl.impact,
    })),
    evidence: [],
  }
}

// ========================
// Journey 1: E-commerce Checkout (Current) -- Rich data
// ========================

const ecomStages: Stage[] = [
  {
    id: "j1-s1",
    name: "Cart Review",
    order: 1,
    steps: [
      {
        id: "j1-s1-st1",
        name: "View Cart Summary",
        description: "Customer reviews items in their shopping cart",
        order: 1,
        touchPoints: [
          tp("j1-tp-1", "Web", "Shopping cart page loads with item list, prices, thumbnails", 3, [], [
            { desc: "Clean layout with product images", impact: "medium" },
          ]),
          tp("j1-tp-2", "Web", "Stock availability indicator shown per item", 2, [
            { desc: "Out-of-stock items not clearly flagged", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j1-s1-st2",
        name: "Update Quantities",
        description: "Customer modifies item quantities or removes items",
        order: 2,
        touchPoints: [
          tp("j1-tp-3", "Web", "Quantity selector with +/- buttons and direct input", 1, [
            { desc: "No bulk quantity option for repeat purchases", severity: "low" },
          ]),
          tp("j1-tp-4", "Web", "Price updates in real-time on quantity change", 2, [], [
            { desc: "Instant price recalculation feels responsive", impact: "medium" },
          ]),
        ],
      },
      {
        id: "j1-s1-st3",
        name: "Apply Promotions",
        description: "Customer attempts to apply discount or coupon codes",
        order: 3,
        touchPoints: [
          tp("j1-tp-5", "Web", "Coupon code input field with Apply button", -2, [
            { desc: "Invalid coupon gives generic error with no guidance", severity: "high" },
            { desc: "Cannot stack multiple promotions", severity: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j1-s2",
    name: "Shipping",
    order: 2,
    steps: [
      {
        id: "j1-s2-st1",
        name: "Enter Address",
        description: "Customer provides shipping address details",
        order: 1,
        touchPoints: [
          tp("j1-tp-6", "Web", "Address form with multiple required fields", -1, [
            { desc: "No address autocomplete increases form friction", severity: "high" },
            { desc: "Phone number field required but purpose unclear", severity: "low" },
          ]),
          tp("j1-tp-7", "Web", "Address validation feedback", 0, [
            { desc: "Validation only triggers on submit, not inline", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j1-s2-st2",
        name: "Select Shipping Method",
        description: "Customer chooses between shipping speed options",
        order: 2,
        touchPoints: [
          tp("j1-tp-8", "Web", "List of shipping options with estimated dates and prices", 1, [
            { desc: "Free shipping threshold not clearly communicated", severity: "medium" },
          ], [
            { desc: "Delivery date estimates are specific and accurate", impact: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j1-s3",
    name: "Payment",
    order: 3,
    steps: [
      {
        id: "j1-s3-st1",
        name: "Select Payment Method",
        description: "Customer chooses how to pay",
        order: 1,
        touchPoints: [
          tp("j1-tp-9", "Web", "Payment method tabs: Credit Card, PayPal, Apple Pay", 0, [
            { desc: "Saved cards not available for guest checkout", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j1-s3-st2",
        name: "Enter Payment Details",
        description: "Customer provides credit card or payment info",
        order: 2,
        touchPoints: [
          tp("j1-tp-10", "Web", "Credit card form with card number, expiry, CVV fields", -2, [
            { desc: "No card type auto-detection", severity: "low" },
            { desc: "Form clears on validation error, requiring re-entry", severity: "critical" },
          ]),
          tp("j1-tp-11", "Web", "Security badges and trust indicators", 1, [], [
            { desc: "SSL badge and PCI compliance logo build trust", impact: "high" },
          ]),
        ],
      },
      {
        id: "j1-s3-st3",
        name: "Payment Processing",
        description: "System processes the payment transaction",
        order: 3,
        touchPoints: [
          tp("j1-tp-12", "Web", "Loading spinner during payment processing", -3, [
            { desc: "No progress indication during 5-8 second wait", severity: "high" },
            { desc: "Users unsure if they should click again or wait", severity: "critical" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j1-s4",
    name: "Confirmation",
    order: 4,
    steps: [
      {
        id: "j1-s4-st1",
        name: "Order Confirmation Page",
        description: "Customer sees order confirmation with summary",
        order: 1,
        touchPoints: [
          tp("j1-tp-13", "Web", "Confirmation page with order number, summary, and next steps", 4, [], [
            { desc: "Clear order number and estimated delivery date", impact: "high" },
            { desc: "Easy-to-find print/save option", impact: "low" },
          ]),
        ],
      },
      {
        id: "j1-s4-st2",
        name: "Confirmation Email",
        description: "Automated order confirmation email sent",
        order: 2,
        touchPoints: [
          tp("j1-tp-14", "Email", "Order confirmation email with tracking link", 3, [
            { desc: "Email sometimes delayed by 10+ minutes", severity: "medium" },
          ], [
            { desc: "Well-formatted email with clear order details", impact: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j1-s5",
    name: "Post-Purchase",
    order: 5,
    steps: [
      {
        id: "j1-s5-st1",
        name: "Track Order",
        description: "Customer checks order status and delivery progress",
        order: 1,
        touchPoints: [
          tp("j1-tp-15", "Web", "Order tracking page with status timeline", 2, [
            { desc: "Tracking updates only every 24 hours", severity: "medium" },
          ]),
          tp("j1-tp-16", "Email", "Shipping update notification emails", 1, [], [
            { desc: "Proactive updates reduce customer anxiety", impact: "medium" },
          ]),
        ],
      },
      {
        id: "j1-s5-st2",
        name: "Receive Package",
        description: "Customer receives and unpacks the order",
        order: 2,
        touchPoints: [
          tp("j1-tp-17", "In-person", "Package delivery and unboxing experience", 3, [], [
            { desc: "Branded packaging creates positive unboxing moment", impact: "high" },
          ]),
        ],
      },
    ],
  },
]

// ========================
// Journey 2: Digital Banking Onboarding (Current)
// ========================

const bankingStages: Stage[] = [
  {
    id: "j2-s1",
    name: "Awareness",
    order: 1,
    steps: [
      {
        id: "j2-s1-st1",
        name: "See Advertisement",
        order: 1,
        touchPoints: [
          tp("j2-tp-1", "Social Media", "Targeted ad on Instagram with value proposition", 2, [], [
            { desc: "Visually appealing ad with clear CTA", impact: "medium" },
          ]),
        ],
      },
      {
        id: "j2-s1-st2",
        name: "Visit Website",
        order: 2,
        touchPoints: [
          tp("j2-tp-2", "Web", "Landing page with feature overview and sign-up prompt", 3, [], [
            { desc: "Comparison table vs competitors is helpful", impact: "high" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j2-s2",
    name: "Sign Up",
    order: 2,
    steps: [
      {
        id: "j2-s2-st1",
        name: "Create Account",
        order: 1,
        touchPoints: [
          tp("j2-tp-3", "Mobile App", "Registration form with email, password, basic info", -1, [
            { desc: "Password requirements not shown upfront", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j2-s2-st2",
        name: "Verify Identity (KYC)",
        order: 2,
        touchPoints: [
          tp("j2-tp-4", "Mobile App", "ID document upload and selfie verification", -4, [
            { desc: "Camera module crashes on older devices", severity: "critical" },
            { desc: "No progress save - restart required on failure", severity: "high" },
            { desc: "Verification takes 24-48 hours with no status updates", severity: "high" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j2-s3",
    name: "Account Setup",
    order: 3,
    steps: [
      {
        id: "j2-s3-st1",
        name: "Link External Accounts",
        order: 1,
        touchPoints: [
          tp("j2-tp-5", "Mobile App", "Plaid integration for linking bank accounts", -2, [
            { desc: "Some banks not supported by Plaid", severity: "medium" },
            { desc: "Connection timeout errors are confusing", severity: "high" },
          ]),
        ],
      },
      {
        id: "j2-s3-st2",
        name: "Set Preferences",
        order: 2,
        touchPoints: [
          tp("j2-tp-6", "Mobile App", "Notification preferences and spending categories setup", 1, [
            { desc: "Too many options presented at once", severity: "low" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j2-s4",
    name: "First Use",
    order: 4,
    steps: [
      {
        id: "j2-s4-st1",
        name: "Explore Dashboard",
        order: 1,
        touchPoints: [
          tp("j2-tp-7", "Mobile App", "Main dashboard with balance, recent transactions, quick actions", 2, [], [
            { desc: "Clean dashboard design is easy to scan", impact: "high" },
          ]),
        ],
      },
      {
        id: "j2-s4-st2",
        name: "First Transaction",
        order: 2,
        touchPoints: [
          tp("j2-tp-8", "Mobile App", "Send money to a contact via the app", 4, [], [
            { desc: "Transaction completes instantly with satisfying animation", impact: "high" },
          ]),
        ],
      },
    ],
  },
]

// ========================
// Journey 3: SaaS Template
// ========================

const saasStages: Stage[] = [
  {
    id: "j3-s1",
    name: "Discovery",
    order: 1,
    steps: [
      {
        id: "j3-s1-st1",
        name: "Landing Page",
        order: 1,
        touchPoints: [tp("j3-tp-1", "Web", "Marketing landing page with pricing and features", 3)],
      },
      {
        id: "j3-s1-st2",
        name: "Sign Up",
        order: 2,
        touchPoints: [tp("j3-tp-2", "Web", "Trial registration form", 2)],
      },
    ],
  },
  {
    id: "j3-s2",
    name: "Activation",
    order: 2,
    steps: [
      {
        id: "j3-s2-st1",
        name: "Onboarding Tour",
        order: 1,
        touchPoints: [tp("j3-tp-3", "Web", "Interactive product walkthrough", 2)],
      },
      {
        id: "j3-s2-st2",
        name: "First Value Moment",
        order: 2,
        touchPoints: [tp("j3-tp-4", "Web", "User completes first meaningful action", 4)],
      },
    ],
  },
  {
    id: "j3-s3",
    name: "Engagement",
    order: 3,
    steps: [
      {
        id: "j3-s3-st1",
        name: "Feature Exploration",
        order: 1,
        touchPoints: [tp("j3-tp-5", "Web", "User discovers additional features", 1)],
      },
      {
        id: "j3-s3-st2",
        name: "Invite Team",
        order: 2,
        touchPoints: [tp("j3-tp-6", "Email", "Team invitation email and onboarding", 0)],
      },
    ],
  },
  {
    id: "j3-s4",
    name: "Conversion",
    order: 4,
    steps: [
      {
        id: "j3-s4-st1",
        name: "Trial Expiry Notice",
        order: 1,
        touchPoints: [tp("j3-tp-7", "Email", "Reminder that trial is ending", -1)],
      },
      {
        id: "j3-s4-st2",
        name: "Upgrade Flow",
        order: 2,
        touchPoints: [tp("j3-tp-8", "Web", "Pricing page and payment form", 2)],
      },
    ],
  },
]

// ========================
// Journey 4: Future Checkout (linked to Journey 1)
// ========================

const futureCheckoutStages: Stage[] = [
  {
    id: "j4-s1",
    name: "Smart Cart",
    order: 1,
    steps: [
      {
        id: "j4-s1-st1",
        name: "AI-Powered Cart",
        description: "Cart with intelligent recommendations and savings suggestions",
        order: 1,
        touchPoints: [
          tp("j4-tp-1", "Web", "Smart cart with personalized product recommendations", 4, [], [
            { desc: "AI suggests complementary items that feel relevant", impact: "high" },
          ]),
          tp("j4-tp-2", "Web", "Auto-applied best available promotions", 4, [], [
            { desc: "No more coupon hunting - best deal auto-applied", impact: "high" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j4-s2",
    name: "Express Checkout",
    order: 2,
    steps: [
      {
        id: "j4-s2-st1",
        name: "Smart Address",
        description: "Address autofill with saved preferences",
        order: 1,
        touchPoints: [
          tp("j4-tp-3", "Web", "Google Places autocomplete with one-tap saved addresses", 4, [], [
            { desc: "Address entry reduced from 30s to 3s", impact: "high" },
          ]),
        ],
      },
      {
        id: "j4-s2-st2",
        name: "One-Click Payment",
        description: "Streamlined payment with biometric verification",
        order: 2,
        touchPoints: [
          tp("j4-tp-4", "Web", "Saved payment method with fingerprint/Face ID confirmation", 5, [], [
            { desc: "Biometric auth feels secure and instant", impact: "high" },
          ]),
          tp("j4-tp-5", "Web", "Real-time payment processing with animated progress", 4, [], [
            { desc: "Clear progress indicator with estimated time", impact: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j4-s3",
    name: "Instant Confirmation",
    order: 3,
    steps: [
      {
        id: "j4-s3-st1",
        name: "Rich Confirmation",
        order: 1,
        touchPoints: [
          tp("j4-tp-6", "Web", "Animated confirmation with order timeline and share option", 5, [], [
            { desc: "Celebration animation creates delight moment", impact: "medium" },
          ]),
        ],
      },
      {
        id: "j4-s3-st2",
        name: "Live Tracking",
        order: 2,
        touchPoints: [
          tp("j4-tp-7", "Mobile App", "Real-time map-based order tracking with push notifications", 5, [], [
            { desc: "Live driver location on map reduces anxiety", impact: "high" },
            { desc: "Push notifications at each status change", impact: "medium" },
          ]),
        ],
      },
    ],
  },
]

// ========================
// Journey 5: Patient Appointment (Deployed) -- Rich data
// ========================

const healthcareStages: Stage[] = [
  {
    id: "j5-s1",
    name: "Need Recognition",
    order: 1,
    steps: [
      {
        id: "j5-s1-st1",
        name: "Symptom Assessment",
        order: 1,
        touchPoints: [
          tp("j5-tp-1", "Web", "Online symptom checker with triage recommendations", -1, [
            { desc: "Symptom checker feels impersonal and generic", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j5-s1-st2",
        name: "Find Provider",
        order: 2,
        touchPoints: [
          tp("j5-tp-2", "Web", "Provider directory with insurance filter and ratings", 1, [
            { desc: "Insurance compatibility not always accurate", severity: "high" },
          ], [
            { desc: "Patient reviews help with provider selection", impact: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j5-s2",
    name: "Booking",
    order: 2,
    steps: [
      {
        id: "j5-s2-st1",
        name: "Select Time Slot",
        order: 1,
        touchPoints: [
          tp("j5-tp-3", "Web", "Calendar view with available appointment slots", 2, [], [
            { desc: "Next-available-slot suggestion saves time", impact: "medium" },
          ]),
        ],
      },
      {
        id: "j5-s2-st2",
        name: "Confirm Appointment",
        order: 2,
        touchPoints: [
          tp("j5-tp-4", "Web", "Appointment summary with confirm button and calendar add", 3, [], [
            { desc: "One-click add to Google/Apple Calendar", impact: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j5-s3",
    name: "Pre-Visit",
    order: 3,
    steps: [
      {
        id: "j5-s3-st1",
        name: "Appointment Reminder",
        order: 1,
        touchPoints: [
          tp("j5-tp-5", "SMS", "Reminder SMS 24h and 1h before appointment", 3, [], [
            { desc: "Timely reminders reduce no-shows by 35%", impact: "high" },
          ]),
        ],
      },
      {
        id: "j5-s3-st2",
        name: "Pre-visit Paperwork",
        order: 2,
        touchPoints: [
          tp("j5-tp-6", "Web", "Digital forms for medical history, insurance, consent", -2, [
            { desc: "Forms require information patient already provided", severity: "high" },
            { desc: "No progress save - must complete in one session", severity: "medium" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j5-s4",
    name: "Visit",
    order: 4,
    steps: [
      {
        id: "j5-s4-st1",
        name: "Check-in",
        order: 1,
        touchPoints: [
          tp("j5-tp-7", "In-person", "Arrival check-in at reception desk or kiosk", 1, [
            { desc: "Wait time after check-in is unpredictable", severity: "medium" },
          ]),
        ],
      },
      {
        id: "j5-s4-st2",
        name: "Consultation",
        order: 2,
        touchPoints: [
          tp("j5-tp-8", "In-person", "Face-to-face consultation with healthcare provider", 4, [], [
            { desc: "Doctor takes time to explain and answer questions", impact: "high" },
          ]),
        ],
      },
    ],
  },
  {
    id: "j5-s5",
    name: "Follow-up",
    order: 5,
    steps: [
      {
        id: "j5-s5-st1",
        name: "Visit Summary",
        order: 1,
        touchPoints: [
          tp("j5-tp-9", "Email", "Email with visit notes, prescriptions, and next steps", 3, [], [
            { desc: "Clear action items and medication instructions", impact: "high" },
          ]),
        ],
      },
      {
        id: "j5-s5-st2",
        name: "Book Follow-up",
        order: 2,
        touchPoints: [
          tp("j5-tp-10", "Mobile App", "One-tap rebooking from visit summary screen", 2, [
            { desc: "Preferred time slots often unavailable", severity: "low" },
          ]),
        ],
      },
    ],
  },
]

// ========================
// Journeys
// ========================

export const journeys: Journey[] = [
  {
    id: "journey-1",
    title: "E-commerce Checkout Journey",
    description:
      "End-to-end checkout experience from cart to order confirmation, including payment and shipping selection.",
    type: "current",
    status: "in_progress",
    archetypes: [archetypes.onlineShopper],
    stages: ecomStages,
    collaborators: [
      { userId: "user-1", role: "journey_master", addedAt: "2024-09-01T00:00:00Z" },
      { userId: "user-2", role: "contributor", addedAt: "2024-09-02T00:00:00Z" },
      { userId: "user-3", role: "viewer", addedAt: "2024-09-05T00:00:00Z" },
    ],
    ownerId: "user-1",
    organizationId: "org-1",
    teamId: "team-1",
    tags: ["e-commerce", "checkout", "web"],
    createdAt: "2024-09-01T00:00:00Z",
    updatedAt: "2026-02-18T14:30:00Z",
  },
  {
    id: "journey-2",
    title: "Digital Banking Onboarding",
    description:
      "New customer onboarding from initial interest through first successful transaction.",
    type: "current",
    status: "review",
    archetypes: [archetypes.newCustomer],
    stages: bankingStages,
    collaborators: [
      { userId: "user-2", role: "journey_master", addedAt: "2024-10-01T00:00:00Z" },
      { userId: "user-1", role: "contributor", addedAt: "2024-10-02T00:00:00Z" },
    ],
    ownerId: "user-2",
    organizationId: "org-1",
    teamId: "team-1",
    tags: ["banking", "onboarding", "mobile"],
    createdAt: "2024-10-01T00:00:00Z",
    updatedAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "journey-3",
    title: "SaaS Free Trial to Paid",
    description:
      "Template for mapping the journey from free trial signup through feature discovery to paid conversion.",
    type: "template",
    status: "approved",
    archetypes: [],
    stages: saasStages,
    collaborators: [],
    ownerId: "user-1",
    organizationId: "org-1",
    teamId: "team-1",
    tags: ["saas", "conversion", "template"],
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "journey-4",
    title: "Improved Checkout Experience (Future)",
    description:
      "Redesigned checkout flow with one-click payment, smart address autofill, and real-time order tracking.",
    type: "future",
    status: "draft",
    archetypes: [archetypes.onlineShopper],
    stages: futureCheckoutStages,
    collaborators: [
      { userId: "user-1", role: "journey_master", addedAt: "2026-01-10T00:00:00Z" },
      { userId: "user-4", role: "contributor", addedAt: "2026-01-12T00:00:00Z" },
    ],
    ownerId: "user-1",
    organizationId: "org-1",
    teamId: "team-2",
    tags: ["e-commerce", "future", "optimization"],
    linkedCurrentJourneyId: "journey-1",
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-02-20T09:00:00Z",
  },
  {
    id: "journey-5",
    title: "Patient Appointment Booking",
    description:
      "Live journey monitoring for the patient appointment booking flow across web and phone channels.",
    type: "deployed",
    status: "deployed",
    archetypes: [archetypes.patientUser],
    stages: healthcareStages,
    collaborators: [
      { userId: "user-1", role: "journey_master", addedAt: "2025-06-01T00:00:00Z" },
      { userId: "user-3", role: "viewer", addedAt: "2025-06-05T00:00:00Z" },
      { userId: "user-2", role: "contributor", addedAt: "2025-07-01T00:00:00Z" },
    ],
    ownerId: "user-1",
    organizationId: "org-1",
    teamId: "team-1",
    tags: ["healthcare", "booking", "deployed"],
    healthStatus: "healthy",
    lastHealthCheck: "2026-02-22T08:00:00Z",
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-02-22T08:00:00Z",
  },
]

// ========================
// Health Indicators (Journey 5)
// ========================

export const healthIndicators: HealthIndicator[] = [
  { id: "hi-1", metric: "Page Load Time", value: 1.2, threshold: 3.0, status: "healthy", unit: "s", lastUpdated: "2026-02-22T08:00:00Z" },
  { id: "hi-2", metric: "Form Completion Rate", value: 72, threshold: 60, status: "healthy", unit: "%", lastUpdated: "2026-02-22T08:00:00Z" },
  { id: "hi-3", metric: "Appointment No-Show Rate", value: 8, threshold: 15, status: "healthy", unit: "%", lastUpdated: "2026-02-22T08:00:00Z" },
  { id: "hi-4", metric: "Avg Wait Time (Check-in)", value: 12, threshold: 10, status: "warning", unit: "min", lastUpdated: "2026-02-22T08:00:00Z" },
  { id: "hi-5", metric: "Patient Satisfaction (NPS)", value: 42, threshold: 30, status: "healthy", unit: "", lastUpdated: "2026-02-22T08:00:00Z" },
  { id: "hi-6", metric: "Digital Form Error Rate", value: 3.2, threshold: 5, status: "healthy", unit: "%", lastUpdated: "2026-02-22T08:00:00Z" },
]

// ========================
// AI Opportunities (Journey 4)
// ========================

export const opportunities: Opportunity[] = [
  {
    id: "opp-1",
    title: "Smart Address Autofill",
    description: "Replace manual address entry with Google Places autocomplete and saved addresses.",
    impact: "high",
    effort: "medium",
    affectedTouchPointIds: ["j1-tp-6", "j1-tp-7"],
    projectedScoreImprovement: 4.5,
  },
  {
    id: "opp-2",
    title: "One-Click Payment",
    description: "Enable biometric-authenticated payment with saved methods, eliminating card re-entry.",
    impact: "high",
    effort: "high",
    affectedTouchPointIds: ["j1-tp-10", "j1-tp-12"],
    projectedScoreImprovement: 6.0,
  },
  {
    id: "opp-3",
    title: "Auto-Applied Promotions",
    description: "Automatically find and apply the best available promotion instead of manual coupon entry.",
    impact: "high",
    effort: "medium",
    affectedTouchPointIds: ["j1-tp-5"],
    projectedScoreImprovement: 5.5,
  },
  {
    id: "opp-4",
    title: "Real-Time Order Tracking",
    description: "Map-based live tracking with push notifications at every status change.",
    impact: "medium",
    effort: "high",
    affectedTouchPointIds: ["j1-tp-15", "j1-tp-16"],
    projectedScoreImprovement: 3.0,
  },
  {
    id: "opp-5",
    title: "Payment Progress Indicator",
    description: "Replace spinner with animated progress bar and estimated time during payment processing.",
    impact: "medium",
    effort: "low",
    affectedTouchPointIds: ["j1-tp-12"],
    projectedScoreImprovement: 4.0,
  },
]

// ========================
// Gap Analysis (Journey 4 vs Journey 1)
// ========================

export const gapAnalysisData: GapAnalysisEntry[] = [
  { touchPointName: "Coupon / Promotions", stageName: "Cart Review", currentScore: -2, futureScore: 4, gap: 6, opportunityCount: 1 },
  { touchPointName: "Address Entry", stageName: "Shipping", currentScore: -1, futureScore: 4, gap: 5, opportunityCount: 1 },
  { touchPointName: "Payment Processing", stageName: "Payment", currentScore: -3, futureScore: 4, gap: 7, opportunityCount: 2 },
  { touchPointName: "Payment Entry", stageName: "Payment", currentScore: -2, futureScore: 5, gap: 7, opportunityCount: 1 },
  { touchPointName: "Order Tracking", stageName: "Post-Purchase", currentScore: 2, futureScore: 5, gap: 3, opportunityCount: 1 },
  { touchPointName: "Cart Summary", stageName: "Cart Review", currentScore: 3, futureScore: 4, gap: 1, opportunityCount: 0 },
  { touchPointName: "Confirmation Page", stageName: "Confirmation", currentScore: 4, futureScore: 5, gap: 1, opportunityCount: 0 },
]

// ========================
// Comments
// ========================

export const comments: Comment[] = [
  {
    id: "cmt-1",
    journeyId: "journey-1",
    content: "The payment processing wait time is our biggest pain point. Users are clicking the pay button multiple times.",
    authorId: "user-2",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-18T10:30:00Z",
    stageId: "j1-s3",
    stepId: "j1-s3-st2",
    reactions: [{ emoji: "thumbsup", userIds: ["user-1", "user-4"] }],
  },
  {
    id: "cmt-2",
    journeyId: "journey-1",
    content: "@Alex I agree, we should prioritize the progress indicator fix. The data shows 12% of users abandon at this step.",
    authorId: "user-4",
    mentions: ["user-1"],
    resolved: false,
    createdAt: "2026-02-18T11:15:00Z",
    parentId: "cmt-1",
    stageId: "j1-s3",
    stepId: "j1-s3-st2",
  },
  {
    id: "cmt-3",
    journeyId: "journey-4",
    content: "The one-click payment flow looks great! Projected score improvement of +6 is significant.",
    authorId: "user-4",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-21T16:45:00Z",
  },
  {
    id: "cmt-4",
    journeyId: "journey-2",
    content: "The KYC verification step is the biggest drop-off point. We need to address the camera crashes on older devices.",
    authorId: "user-2",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-15T09:00:00Z",
    stageId: "j2-s3",
    stepId: "j2-s3-st1",
  },
  {
    id: "cmt-5",
    journeyId: "journey-5",
    content: "Wait time metric is trending toward warning. We should flag this to the clinic operations team.",
    authorId: "user-1",
    mentions: ["user-3"],
    resolved: true,
    createdAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "cmt-6",
    journeyId: "journey-1",
    content: "The coupon code error is a huge friction point. @Sarah can we get the UX team to prototype a better validation flow?",
    authorId: "user-1",
    mentions: ["user-2"],
    resolved: false,
    createdAt: "2026-02-19T09:00:00Z",
    stageId: "j1-s1",
    stepId: "j1-s1-st3",
    reactions: [{ emoji: "eyes", userIds: ["user-2"] }, { emoji: "fire", userIds: ["user-4"] }],
  },
  {
    id: "cmt-7",
    journeyId: "journey-1",
    content: "On it! I've asked the team to look at inline validation patterns. Should have mockups by Friday.",
    authorId: "user-2",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-19T10:30:00Z",
    parentId: "cmt-6",
    stageId: "j1-s1",
    stepId: "j1-s1-st3",
  },
  {
    id: "cmt-8",
    journeyId: "journey-1",
    content: "Address form friction is confirmed in our latest usability study. 34% of users paused for more than 20 seconds on this step.",
    authorId: "user-4",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-17T14:00:00Z",
    stageId: "j1-s2",
    stepId: "j1-s2-st1",
    reactions: [{ emoji: "warning", userIds: ["user-1", "user-2"] }],
  },
  {
    id: "cmt-9",
    journeyId: "journey-1",
    content: "We should add Google Places autocomplete here. It reduced address entry time by 60% on ProjectX.",
    authorId: "user-1",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-17T15:30:00Z",
    parentId: "cmt-8",
    stageId: "j1-s2",
    stepId: "j1-s2-st1",
  },
  {
    id: "cmt-10",
    journeyId: "journey-1",
    content: "Confirmation page looks solid. The order summary with delivery estimate is well-received in testing.",
    authorId: "user-2",
    mentions: [],
    resolved: true,
    createdAt: "2026-02-16T11:00:00Z",
    stageId: "j1-s5",
    reactions: [{ emoji: "tada", userIds: ["user-1", "user-4"] }],
  },
  {
    id: "cmt-11",
    journeyId: "journey-1",
    content: "@Priya could you add the heatmap data from the last analytics sprint? It would strengthen the evidence here.",
    authorId: "user-2",
    mentions: ["user-4"],
    resolved: false,
    createdAt: "2026-02-20T10:00:00Z",
    stageId: "j1-s3",
    stepId: "j1-s3-st1",
    editedAt: "2026-02-20T10:15:00Z",
  },
  {
    id: "cmt-12",
    journeyId: "journey-1",
    content: "Done! Added the click density data and scroll depth report as new evidence items.",
    authorId: "user-4",
    mentions: [],
    resolved: false,
    createdAt: "2026-02-20T14:30:00Z",
    parentId: "cmt-11",
    stageId: "j1-s3",
    stepId: "j1-s3-st1",
  },
]

export function getCommentsForStage(journeyId: string, stageId: string): Comment[] {
  return comments.filter((c) => c.journeyId === journeyId && c.stageId === stageId)
}

export function getCommentsForStep(journeyId: string, stepId: string): Comment[] {
  return comments.filter((c) => c.journeyId === journeyId && c.stepId === stepId)
}

export function getUnresolvedCommentCount(journeyId: string): number {
  return comments.filter((c) => c.journeyId === journeyId && !c.resolved && !c.parentId).length
}

// ========================
// Activity Log
// ========================

export const activityLog: ActivityLogEntry[] = [
  {
    id: "act-1",
    action: "edited",
    actorId: "user-2",
    journeyId: "journey-1",
    timestamp: "2026-02-22T09:30:00Z",
    details: "Updated touch point scores in the Payment stage",
    stageId: "j1-s3",
  },
  {
    id: "act-2",
    action: "commented",
    actorId: "user-4",
    journeyId: "journey-4",
    timestamp: "2026-02-21T16:45:00Z",
    details: "Commented on the one-click payment opportunity",
    commentPreview: "The one-click payment flow looks great! Projected score improvement of +6 is significant.",
  },
  {
    id: "act-2b",
    action: "mentioned_you",
    actorId: "user-2",
    journeyId: "journey-1",
    timestamp: "2026-02-20T10:00:00Z",
    details: "Mentioned you in a comment on Payment > Select Payment Method",
    stageId: "j1-s3",
    stepId: "j1-s3-st1",
    commentPreview: "@Priya could you add the heatmap data from the last analytics sprint?",
  },
  {
    id: "act-3",
    action: "status_changed",
    actorId: "user-2",
    journeyId: "journey-2",
    timestamp: "2026-02-20T11:00:00Z",
    details: 'Moved "Digital Banking Onboarding" to Review status',
  },
  {
    id: "act-3b",
    action: "commented",
    actorId: "user-1",
    journeyId: "journey-1",
    timestamp: "2026-02-19T09:00:00Z",
    details: "Commented on Cart Review > Apply Promotions",
    stageId: "j1-s1",
    stepId: "j1-s1-st3",
    commentPreview: "The coupon code error is a huge friction point. @Sarah can we get the UX team to prototype a better validation flow?",
  },
  {
    id: "act-4",
    action: "created",
    actorId: "user-1",
    journeyId: "journey-4",
    timestamp: "2026-02-19T10:00:00Z",
    details: 'Created "Improved Checkout Experience (Future)"',
  },
  {
    id: "act-5",
    action: "deployed",
    actorId: "user-1",
    journeyId: "journey-5",
    timestamp: "2026-02-18T15:00:00Z",
    details: 'Deployed "Patient Appointment Booking" to live monitoring',
  },
  {
    id: "act-5b",
    action: "commented",
    actorId: "user-2",
    journeyId: "journey-1",
    timestamp: "2026-02-18T10:30:00Z",
    details: "Commented on Payment > Process Payment",
    stageId: "j1-s3",
    stepId: "j1-s3-st2",
    commentPreview: "The payment processing wait time is our biggest pain point. Users are clicking the pay button multiple times.",
  },
  {
    id: "act-6",
    action: "edited",
    actorId: "user-1",
    journeyId: "journey-1",
    timestamp: "2026-02-17T14:20:00Z",
    details: "Added pain points to the Apply Promotions touch point",
    stageId: "j1-s1",
    stepId: "j1-s1-st3",
  },
  {
    id: "act-7",
    action: "shared",
    actorId: "user-2",
    journeyId: "journey-2",
    timestamp: "2026-02-16T09:00:00Z",
    details: "Shared journey with James Wilson (viewer)",
  },
  {
    id: "act-8",
    action: "commented",
    actorId: "user-2",
    journeyId: "journey-1",
    timestamp: "2026-02-15T16:30:00Z",
    details: "Commented on payment processing wait time issue",
    stageId: "j1-s3",
    commentPreview: "The payment processing wait time is our biggest pain point.",
  },
  {
    id: "act-9",
    action: "edited",
    actorId: "user-4",
    journeyId: "journey-4",
    timestamp: "2026-02-14T11:00:00Z",
    details: "Added AI-powered cart recommendation touch point",
  },
  {
    id: "act-10",
    action: "created",
    actorId: "user-2",
    journeyId: "journey-2",
    timestamp: "2024-10-01T00:00:00Z",
    details: 'Created "Digital Banking Onboarding" journey',
  },
]

// ========================
// Notifications
// ========================

export const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "comment",
    message: 'Priya Patel commented on "Improved Checkout Experience"',
    read: false,
    createdAt: "2026-02-21T16:45:00Z",
    link: "/journeys/journey-4",
  },
  {
    id: "notif-2",
    type: "status_change",
    message: '"Digital Banking Onboarding" moved to Review',
    read: false,
    createdAt: "2026-02-20T11:00:00Z",
    link: "/journeys/journey-2",
  },
  {
    id: "notif-3",
    type: "health_alert",
    message: "Wait time metric approaching warning threshold",
    read: false,
    createdAt: "2026-02-22T08:00:00Z",
    link: "/journeys/journey-5/health",
  },
  {
    id: "notif-4",
    type: "mention",
    message: "Sarah Chen mentioned you in a comment on Checkout Journey",
    read: true,
    createdAt: "2026-02-19T14:00:00Z",
    link: "/journeys/journey-1",
  },
  {
    id: "notif-5",
    type: "comment",
    message: "Priya Patel replied to your comment on payment processing",
    read: true,
    createdAt: "2026-02-18T11:15:00Z",
    link: "/journeys/journey-1",
  },
]

// ========================
// Dashboard Stats
// ========================

export const dashboardStats: DashboardStats = {
  totalJourneys: 5,
  activeCollaborators: 4,
  avgEmotionalScore: 1.2,
  avgEmotionalScoreTrend: 12.5,
  deployedJourneys: 1,
  healthyDeployed: 1,
}

// ========================
// Solutions (formerly Trends)
// ========================

export const solutions: Solution[] = [
  // --- Platform Solutions ---
  {
    id: "sol-1",
    title: "Anchoring Effect in Pricing Displays",
    category: "behavioral",
    description: "Display a higher-priced option first to anchor customer expectations, making subsequent prices feel more reasonable. Proven to increase conversion by 12-18%.",
    source: "Journal of Consumer Psychology, 2025",
    tags: ["pricing", "conversion", "checkout", "behavioral-economics"],
    relevance: 92,
    upvotes: 347,
    saved: false,
    publishedAt: "2026-01-15T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-2",
    title: "Morning Ritual Integration for Onboarding",
    category: "rituals",
    description: "Embed onboarding steps into existing morning routines (e.g., first coffee check-in). Users who engage with ritual-based onboarding show 3x higher 30-day retention.",
    source: "UX Research Lab",
    tags: ["onboarding", "retention", "habits", "engagement"],
    relevance: 85,
    upvotes: 213,
    saved: true,
    publishedAt: "2026-01-20T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-3",
    title: "Predictive Shipping Notifications",
    category: "technological",
    description: "Use ML models to predict delivery windows and proactively notify customers before they check. Reduces support inquiries by 40% and increases satisfaction scores.",
    source: "MIT Technology Review",
    tags: ["shipping", "AI", "notifications", "logistics"],
    relevance: 88,
    upvotes: 289,
    saved: false,
    publishedAt: "2026-02-01T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-4",
    title: "Circular Returns Program",
    category: "environmental",
    description: "Offer sustainable return options: refurbishment, recycling credits, or charity donation. Customers who use circular returns have 25% higher NPS.",
    source: "Sustainable Commerce Institute",
    tags: ["returns", "sustainability", "NPS", "loyalty"],
    relevance: 78,
    upvotes: 156,
    saved: false,
    publishedAt: "2026-01-28T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-5",
    title: "Social Proof Cascading in Checkout",
    category: "social",
    description: "Display real-time purchase counts, recent buyer locations, and review snippets at checkout. Creates urgency and social validation simultaneously.",
    source: "Behavioral Science Quarterly",
    tags: ["checkout", "social-proof", "urgency", "conversion"],
    relevance: 90,
    upvotes: 412,
    saved: true,
    publishedAt: "2026-02-10T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-6",
    title: "Industry-Standard Wait Time Benchmarking",
    category: "industrial",
    description: "Compare your service wait times against industry benchmarks. Displaying 'faster than 80% of competitors' messaging can improve perceived service quality by 35%.",
    source: "Service Quality Association",
    tags: ["benchmarking", "wait-time", "perception", "service"],
    relevance: 72,
    upvotes: 98,
    saved: false,
    publishedAt: "2026-02-05T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-7",
    title: "Loss Aversion Cart Recovery",
    category: "behavioral",
    description: "Frame abandoned cart emails around what customers will lose (saved items, applied discounts) rather than what they gain. Increases recovery rate by 22%.",
    source: "E-Commerce Psychology Lab",
    tags: ["cart-recovery", "email", "loss-aversion", "behavioral-economics"],
    relevance: 94,
    upvotes: 523,
    saved: false,
    publishedAt: "2026-02-12T00:00:00Z",
    isCrowd: false,
  },
  {
    id: "sol-8",
    title: "Seasonal Micro-Rituals in Loyalty Programs",
    category: "rituals",
    description: "Create small seasonal engagement rituals (spring refresh, year-end reviews) that reinforce loyalty program value. Members engaged in rituals spend 45% more annually.",
    source: "Loyalty Science Institute",
    tags: ["loyalty", "rituals", "engagement", "seasonal"],
    relevance: 76,
    upvotes: 134,
    saved: false,
    publishedAt: "2026-01-08T00:00:00Z",
    isCrowd: false,
  },
  // --- Crowd Solutions ---
  {
    id: "sol-crowd-1",
    title: "Guest Checkout with Post-Purchase Account Creation",
    category: "technological",
    description: "We removed mandatory registration before checkout and instead offer frictionless account creation post-purchase using the order details. Cart abandonment dropped 31%.",
    source: "Community",
    tags: ["checkout", "registration", "friction", "conversion"],
    relevance: 96,
    upvotes: 678,
    saved: true,
    publishedAt: "2026-02-18T00:00:00Z",
    isCrowd: true,
    industry: "E-Commerce",
    applicableStage: "Checkout",
    contributorOrg: "RetailCo (anonymized)",
  },
  {
    id: "sol-crowd-2",
    title: "Empathy Mapping in Support Ticket Triage",
    category: "social",
    description: "Our support team uses empathy maps to categorize tickets by emotional state, not just topic. Resolution satisfaction improved by 28% and first-response empathy scores jumped.",
    source: "Community",
    tags: ["support", "empathy", "triage", "customer-service"],
    relevance: 82,
    upvotes: 245,
    saved: false,
    publishedAt: "2026-02-14T00:00:00Z",
    isCrowd: true,
    industry: "SaaS",
    applicableStage: "Support",
    contributorOrg: "TechStartup (anonymized)",
  },
  {
    id: "sol-crowd-3",
    title: "Carbon Footprint Transparency at Checkout",
    category: "environmental",
    description: "Displaying the carbon footprint of each delivery option let customers self-select green shipping. 38% chose the eco option and our brand perception improved markedly.",
    source: "Community",
    tags: ["sustainability", "shipping", "transparency", "green"],
    relevance: 74,
    upvotes: 189,
    saved: false,
    publishedAt: "2026-02-08T00:00:00Z",
    isCrowd: true,
    industry: "E-Commerce",
    applicableStage: "Delivery",
    contributorOrg: "EcoShop (anonymized)",
  },
  {
    id: "sol-crowd-4",
    title: "Gamified Onboarding Checklists with Streaks",
    category: "behavioral",
    description: "We added a streak counter to our onboarding checklist. Users who hit a 3-day streak had 2.5x higher activation rates. Simple but incredibly effective.",
    source: "Community",
    tags: ["onboarding", "gamification", "streaks", "activation"],
    relevance: 88,
    upvotes: 356,
    saved: false,
    publishedAt: "2026-02-16T00:00:00Z",
    isCrowd: true,
    industry: "SaaS",
    applicableStage: "Onboarding",
    contributorOrg: "GrowthApp (anonymized)",
  },
]

export function getPlatformSolutions(): Solution[] {
  return solutions.filter((s) => !s.isCrowd)
}

export function getCrowdSolutions(): Solution[] {
  return solutions.filter((s) => s.isCrowd)
}

export function getSolutionsByCategory(category: SolutionCategory): Solution[] {
  return solutions.filter((s) => s.category === category)
}

// ========================
// Helpers
// ========================

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find((j) => j.id === id)
}

export function getJourneysByType(type: Journey["type"]): Journey[] {
  return journeys.filter((j) => j.type === type)
}

export function getCommentsForJourney(journeyId: string): Comment[] {
  return comments.filter((c) => c.journeyId === journeyId)
}

export function getActivityForJourney(journeyId: string): ActivityLogEntry[] {
  return activityLog.filter((a) => a.journeyId === journeyId)
}

export function getEmotionalArc(journey: Journey) {
  return journey.stages.map((stage) => {
    const scores = stage.steps.flatMap((step) =>
      step.touchPoints.map((tp) => tp.emotionalScore)
    )
    const avg =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0
    return { stageName: stage.name, score: Math.round(avg * 10) / 10 }
  })
}

export function getAllTouchPoints(journey: Journey): Array<TouchPoint & { stageName: string; stepName: string }> {
  return journey.stages.flatMap((stage) =>
    stage.steps.flatMap((step) =>
      step.touchPoints.map((touchPoint) => ({
        ...touchPoint,
        stageName: stage.name,
        stepName: step.name,
      }))
    )
  )
}

export function getEmotionalScoreColor(score: number): string {
  if (score <= -3) return "text-red-600 dark:text-red-400"
  if (score <= -1) return "text-orange-500 dark:text-orange-400"
  if (score <= 1) return "text-yellow-500 dark:text-yellow-400"
  if (score <= 3) return "text-emerald-500 dark:text-emerald-400"
  return "text-green-600 dark:text-green-400"
}

export function getEmotionalScoreBg(score: number): string {
  if (score <= -3) return "bg-red-100 dark:bg-red-900/30"
  if (score <= -1) return "bg-orange-100 dark:bg-orange-900/30"
  if (score <= 1) return "bg-yellow-100 dark:bg-yellow-900/30"
  if (score <= 3) return "bg-emerald-100 dark:bg-emerald-900/30"
  return "bg-green-100 dark:bg-green-900/30"
}

export function getHealthStatusColor(status: string): string {
  switch (status) {
    case "healthy": return "text-green-600 dark:text-green-400"
    case "warning": return "text-yellow-500 dark:text-yellow-400"
    case "critical": return "text-red-600 dark:text-red-400"
    default: return "text-muted-foreground"
  }
}

export function getHealthStatusBg(status: string): string {
  switch (status) {
    case "healthy": return "bg-green-100 dark:bg-green-900/30"
    case "warning": return "bg-yellow-100 dark:bg-yellow-900/30"
    case "critical": return "bg-red-100 dark:bg-red-900/30"
    default: return "bg-muted"
  }
}

// ========================
// Journey Versions
// ========================

import type { JourneyVersion } from "./types"

export const journeyVersions: JourneyVersion[] = [
  {
    id: "ver-1-1",
    journeyId: "journey-1",
    versionNumber: 1,
    label: "Initial draft",
    snapshot: journeys[0],
    createdBy: "user-1",
    createdAt: "2025-02-01T10:00:00Z",
    changesSummary: "Created initial journey with 5 stages and 15 steps",
  },
  {
    id: "ver-1-2",
    journeyId: "journey-1",
    versionNumber: 2,
    snapshot: journeys[0],
    createdBy: "user-2",
    createdAt: "2025-04-15T14:30:00Z",
    changesSummary: "Added pain points to Cart Review and Payment stages",
  },
  {
    id: "ver-1-3",
    journeyId: "journey-1",
    versionNumber: 3,
    label: "Before Q3 redesign",
    snapshot: journeys[0],
    createdBy: "user-1",
    createdAt: "2025-07-20T09:00:00Z",
    changesSummary: "Restructured Shipping stage, added address validation step",
  },
  {
    id: "ver-1-4",
    journeyId: "journey-1",
    versionNumber: 4,
    label: "Post-research update",
    snapshot: journeys[0],
    createdBy: "user-4",
    createdAt: "2025-11-10T16:15:00Z",
    changesSummary: "Updated emotional scores based on November user research sessions",
  },
  {
    id: "ver-1-5",
    journeyId: "journey-1",
    versionNumber: 5,
    label: "Current",
    snapshot: journeys[0],
    createdBy: "user-2",
    createdAt: "2026-02-22T09:30:00Z",
    changesSummary: "Refined touch point scores in Payment stage, added new evidence links",
  },
  {
    id: "ver-2-1",
    journeyId: "journey-2",
    versionNumber: 1,
    label: "Initial mapping",
    snapshot: journeys[1],
    createdBy: "user-2",
    createdAt: "2024-10-01T00:00:00Z",
    changesSummary: "Created banking onboarding journey with 5 stages",
  },
  {
    id: "ver-2-2",
    journeyId: "journey-2",
    versionNumber: 2,
    snapshot: journeys[1],
    createdBy: "user-2",
    createdAt: "2025-01-15T10:00:00Z",
    changesSummary: "Added KYC verification pain points, updated emotional scores",
  },
  {
    id: "ver-2-3",
    journeyId: "journey-2",
    versionNumber: 3,
    label: "Current",
    snapshot: journeys[1],
    createdBy: "user-1",
    createdAt: "2026-02-20T11:00:00Z",
    changesSummary: "Moved to Review status, added camera crash evidence to KYC step",
  },
  {
    id: "ver-4-1",
    journeyId: "journey-4",
    versionNumber: 1,
    label: "Initial future vision",
    snapshot: journeys[3],
    createdBy: "user-1",
    createdAt: "2026-02-19T10:00:00Z",
    changesSummary: "Created future checkout journey with AI-powered improvements",
  },
  {
    id: "ver-4-2",
    journeyId: "journey-4",
    versionNumber: 2,
    label: "Current",
    snapshot: journeys[3],
    createdBy: "user-4",
    createdAt: "2026-02-21T16:45:00Z",
    changesSummary: "Added one-click payment and smart cart recommendation touch points",
  },
]

export function getVersionsForJourney(journeyId: string): JourneyVersion[] {
  return journeyVersions
    .filter((v) => v.journeyId === journeyId)
    .sort((a, b) => b.versionNumber - a.versionNumber)
}

export function getAllArchetypes(): Archetype[] {
  return Object.values(archetypes)
}

export function getArchetypeById(id: string): Archetype | undefined {
  return Object.values(archetypes).find((a) => a.id === id)
}

export function getArchetypesByCategory(category: string): Archetype[] {
  return Object.values(archetypes).filter((a) => a.category === category)
}
