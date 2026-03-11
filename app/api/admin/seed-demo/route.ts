import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// JDS-028: Seed comprehensive demo data across all journey types
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get user's org + team
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 })

  const { data: teams } = await supabase.from("teams").select("id").eq("organization_id", profile.organization_id).limit(1)
  const teamId = teams?.[0]?.id
  if (!teamId) return NextResponse.json({ error: "No team" }, { status: 400 })

  const orgId = profile.organization_id

  try {
    // ============================================================
    // 1. CREATE DEMO JOURNEYS (one per type: current, future, deployed)
    // ============================================================
    const journeyDefs = [
      {
        title: "E-Commerce Purchase Journey (Current State)",
        description: "Complete current-state mapping of the online purchase experience for a mid-market retail brand, from initial product discovery through post-purchase loyalty. Includes pain points at checkout and returns stages.",
        type: "current",
        status: "approved",
        tags: ["e-commerce", "retail", "purchase"],
        health_status: "warning",
      },
      {
        title: "Mobile Banking Onboarding (Future State)",
        description: "Redesigned onboarding experience for a digital-first banking app targeting Gen Z and millennials. Addresses KYC friction, first deposit flow, and establishing regular usage patterns within the first 30 days.",
        type: "future",
        status: "in_progress",
        tags: ["banking", "fintech", "onboarding", "mobile"],
        health_status: "healthy",
      },
      {
        title: "Healthcare Patient Portal (Deployed)",
        description: "Live patient portal journey covering appointment scheduling, telehealth visits, prescription management, and insurance claims. Deployed to 50k+ active patients with ongoing measurement.",
        type: "deployed",
        status: "deployed",
        tags: ["healthcare", "telehealth", "patient-experience"],
        health_status: "healthy",
      },
    ]

    const journeyIds: string[] = []
    for (const jDef of journeyDefs) {
      const { data: j, error } = await supabase.from("journeys").insert({
        ...jDef,
        owner_id: user.id,
        organization_id: orgId,
        team_id: teamId,
      }).select("id").single()
      if (error) throw error
      journeyIds.push(j.id)
    }

    // ============================================================
    // 2. STAGES + STEPS + TOUCHPOINTS + PAIN POINTS + HIGHLIGHTS
    // ============================================================

    // --- Journey 1: E-Commerce Purchase (Current State) ---
    const ecomStages = [
      {
        name: "Discovery",
        steps: [
          { name: "Social media ad exposure", touchpoints: [
            { channel: "Instagram", description: "User sees targeted product ad in feed", emotional_score: 1, painPoints: [], highlights: ["Eye-catching creative drives initial interest"] },
            { channel: "Google Search", description: "User searches for product category", emotional_score: 0, painPoints: ["SEO results show competitor products first"], highlights: [] },
          ]},
          { name: "Landing page visit", touchpoints: [
            { channel: "Website", description: "User lands on product category page", emotional_score: 2, painPoints: [], highlights: ["Fast page load time under 2 seconds"] },
          ]},
          { name: "Product browsing", touchpoints: [
            { channel: "Website", description: "User browses product listings with filters", emotional_score: 1, painPoints: ["Filter options are confusing and don't remember selections"], highlights: [] },
          ]},
        ],
      },
      {
        name: "Evaluation",
        steps: [
          { name: "Product detail review", touchpoints: [
            { channel: "Website", description: "User views product images, specs, and reviews", emotional_score: 3, painPoints: [], highlights: ["360-degree product viewer increases confidence"] },
          ]},
          { name: "Price comparison", touchpoints: [
            { channel: "Website", description: "User compares pricing across sizes and bundles", emotional_score: 0, painPoints: ["No easy way to compare across products"], highlights: [] },
          ]},
          { name: "Read reviews", touchpoints: [
            { channel: "Website", description: "User reads verified customer reviews", emotional_score: 2, painPoints: ["Cannot filter reviews by use case or body type"], highlights: ["Photo reviews add authenticity"] },
          ]},
        ],
      },
      {
        name: "Purchase",
        steps: [
          { name: "Add to cart", touchpoints: [
            { channel: "Website", description: "User adds selected items to shopping cart", emotional_score: 1, painPoints: [], highlights: ["Sticky add-to-cart button is easy to find"] },
          ]},
          { name: "Checkout", touchpoints: [
            { channel: "Website", description: "Multi-step checkout form with address, shipping, payment", emotional_score: -2, painPoints: ["Checkout requires account creation before payment", "Shipping costs only revealed at final step"], highlights: [] },
          ]},
          { name: "Payment", touchpoints: [
            { channel: "Payment Gateway", description: "User enters payment details or uses digital wallet", emotional_score: -1, painPoints: ["Apple Pay option not available on all browsers"], highlights: [] },
          ]},
          { name: "Order confirmation", touchpoints: [
            { channel: "Email", description: "User receives order confirmation email", emotional_score: 3, painPoints: [], highlights: ["Clear order summary with estimated delivery date"] },
          ]},
        ],
      },
      {
        name: "Delivery",
        steps: [
          { name: "Shipping notification", touchpoints: [
            { channel: "SMS", description: "User receives shipping notification with tracking", emotional_score: 2, painPoints: [], highlights: ["Real-time tracking updates reduce anxiety"] },
          ]},
          { name: "Package delivery", touchpoints: [
            { channel: "Physical", description: "Package arrives at door", emotional_score: 4, painPoints: [], highlights: ["Premium unboxing experience with branded packaging"] },
          ]},
        ],
      },
      {
        name: "Post-Purchase",
        steps: [
          { name: "Product usage", touchpoints: [
            { channel: "Physical", description: "Customer uses the product for the first time", emotional_score: 3, painPoints: [], highlights: ["Product exceeds expectations from online photos"] },
          ]},
          { name: "Review request", touchpoints: [
            { channel: "Email", description: "Automated email requesting a product review", emotional_score: 0, painPoints: ["Review request sent too early before product is fully tried"], highlights: [] },
          ]},
          { name: "Returns process", touchpoints: [
            { channel: "Website", description: "User initiates a return through the website", emotional_score: -3, painPoints: ["Return process requires calling customer service", "Refund takes 10+ business days"], highlights: [] },
          ]},
        ],
      },
    ]

    // --- Journey 2: Mobile Banking Onboarding (Future State) ---
    const bankingStages = [
      {
        name: "Awareness",
        steps: [
          { name: "App store discovery", touchpoints: [
            { channel: "App Store", description: "User finds app through search or recommendation", emotional_score: 2, painPoints: [], highlights: ["4.8-star rating builds trust"] },
          ]},
          { name: "Marketing touchpoint", touchpoints: [
            { channel: "Social Media", description: "User sees influencer review or social ad", emotional_score: 3, painPoints: [], highlights: ["Relatable Gen Z creator makes brand feel approachable"] },
          ]},
        ],
      },
      {
        name: "Registration",
        steps: [
          { name: "Download and open", touchpoints: [
            { channel: "Mobile App", description: "User downloads and opens app for first time", emotional_score: 2, painPoints: [], highlights: ["Animated welcome screen creates excitement"] },
          ]},
          { name: "Identity verification (KYC)", touchpoints: [
            { channel: "Mobile App", description: "User scans ID and takes selfie for verification", emotional_score: 1, painPoints: [], highlights: ["AI-powered ID scan completes in under 60 seconds"] },
          ]},
          { name: "Account setup", touchpoints: [
            { channel: "Mobile App", description: "User sets up account preferences and security", emotional_score: 2, painPoints: [], highlights: ["Biometric login setup makes future access seamless"] },
          ]},
        ],
      },
      {
        name: "Activation",
        steps: [
          { name: "First deposit", touchpoints: [
            { channel: "Mobile App", description: "User makes first deposit via linked bank or card", emotional_score: 3, painPoints: [], highlights: ["Instant transfer with immediate balance update"] },
          ]},
          { name: "Card setup", touchpoints: [
            { channel: "Mobile App", description: "User adds virtual card to Apple/Google Wallet", emotional_score: 4, painPoints: [], highlights: ["One-tap wallet setup with instant virtual card"] },
          ]},
          { name: "First transaction", touchpoints: [
            { channel: "Point of Sale", description: "User makes first purchase with virtual card", emotional_score: 5, painPoints: [], highlights: ["Instant notification with merchant details and rewards earned"] },
          ]},
        ],
      },
      {
        name: "Engagement",
        steps: [
          { name: "Savings goal creation", touchpoints: [
            { channel: "Mobile App", description: "User creates first savings goal with visual tracker", emotional_score: 3, painPoints: [], highlights: ["Gamified progress bar motivates saving"] },
          ]},
          { name: "Spending insights", touchpoints: [
            { channel: "Mobile App", description: "User views AI-powered spending categorization", emotional_score: 4, painPoints: [], highlights: ["Smart categories accurately label transactions"] },
          ]},
        ],
      },
      {
        name: "Advocacy",
        steps: [
          { name: "Referral", touchpoints: [
            { channel: "Mobile App", description: "User shares referral link with friends", emotional_score: 4, painPoints: [], highlights: ["Both referrer and referee get instant bonus"] },
          ]},
          { name: "App review", touchpoints: [
            { channel: "App Store", description: "User leaves positive review after 30 days", emotional_score: 5, painPoints: [], highlights: ["In-app review prompt at peak satisfaction moment"] },
          ]},
        ],
      },
    ]

    // --- Journey 3: Healthcare Patient Portal (Deployed) ---
    const healthcareStages = [
      {
        name: "Access",
        steps: [
          { name: "Portal login", touchpoints: [
            { channel: "Web Portal", description: "Patient logs into the health portal", emotional_score: 1, painPoints: ["Password reset flow requires calling the office"], highlights: [] },
          ]},
          { name: "Dashboard overview", touchpoints: [
            { channel: "Web Portal", description: "Patient views health dashboard with upcoming appointments", emotional_score: 2, painPoints: [], highlights: ["Clear summary of next steps and pending actions"] },
          ]},
        ],
      },
      {
        name: "Scheduling",
        steps: [
          { name: "Find available slots", touchpoints: [
            { channel: "Web Portal", description: "Patient searches for appointment availability", emotional_score: 0, painPoints: ["Specialist availability only shown 2 weeks out"], highlights: [] },
          ]},
          { name: "Book appointment", touchpoints: [
            { channel: "Web Portal", description: "Patient selects slot and confirms booking", emotional_score: 2, painPoints: [], highlights: ["Instant calendar sync with Google/Apple Calendar"] },
          ]},
          { name: "Appointment reminder", touchpoints: [
            { channel: "SMS", description: "Patient receives automated reminder 24h before", emotional_score: 1, painPoints: [], highlights: ["SMS includes preparation instructions"] },
          ]},
        ],
      },
      {
        name: "Consultation",
        steps: [
          { name: "Check-in", touchpoints: [
            { channel: "Web Portal", description: "Patient completes digital check-in and forms", emotional_score: -1, painPoints: ["Forms ask for information already on file"], highlights: [] },
          ]},
          { name: "Telehealth visit", touchpoints: [
            { channel: "Video Call", description: "Patient connects with doctor via video", emotional_score: 3, painPoints: [], highlights: ["Stable video quality with screen sharing for test results"] },
          ]},
          { name: "In-person visit", touchpoints: [
            { channel: "Physical", description: "Patient visits clinic for examination", emotional_score: 2, painPoints: ["Wait time in lobby averages 25 minutes"], highlights: [] },
          ]},
        ],
      },
      {
        name: "Treatment",
        steps: [
          { name: "Prescription management", touchpoints: [
            { channel: "Web Portal", description: "Patient views and refills prescriptions online", emotional_score: 3, painPoints: [], highlights: ["One-click refill with pharmacy delivery option"] },
          ]},
          { name: "Lab results", touchpoints: [
            { channel: "Web Portal", description: "Patient receives lab results with explanations", emotional_score: 1, painPoints: ["Results use medical jargon without plain-language explanations"], highlights: [] },
          ]},
        ],
      },
      {
        name: "Billing",
        steps: [
          { name: "Insurance claim", touchpoints: [
            { channel: "Web Portal", description: "Patient views insurance claim status", emotional_score: -2, painPoints: ["Claim status descriptions are cryptic and unhelpful", "No estimated out-of-pocket cost shown upfront"], highlights: [] },
          ]},
          { name: "Payment", touchpoints: [
            { channel: "Web Portal", description: "Patient pays remaining balance", emotional_score: 0, painPoints: ["No payment plan options for large bills"], highlights: [] },
          ]},
        ],
      },
    ]

    // Insert all stages/steps/touchpoints/painpoints/highlights for each journey
    const allJourneyData = [
      { journeyId: journeyIds[0], stages: ecomStages },
      { journeyId: journeyIds[1], stages: bankingStages },
      { journeyId: journeyIds[2], stages: healthcareStages },
    ]

    for (const { journeyId, stages } of allJourneyData) {
      for (let si = 0; si < stages.length; si++) {
        const stageDef = stages[si]
        const { data: stage, error: stageErr } = await supabase
          .from("stages")
          .insert({ journey_id: journeyId, name: stageDef.name, order: si })
          .select("id")
          .single()
        if (stageErr) throw stageErr

        for (let sti = 0; sti < stageDef.steps.length; sti++) {
          const stepDef = stageDef.steps[sti]
          const { data: step, error: stepErr } = await supabase
            .from("steps")
            .insert({ stage_id: stage.id, name: stepDef.name, order: sti })
            .select("id")
            .single()
          if (stepErr) throw stepErr

          for (const tpDef of stepDef.touchpoints) {
            const { data: tp, error: tpErr } = await supabase
              .from("touch_points")
              .insert({
                step_id: step.id,
                channel: tpDef.channel,
                description: tpDef.description,
                emotional_score: tpDef.emotional_score,
              })
              .select("id")
              .single()
            if (tpErr) throw tpErr

            // Pain points
            for (const ppDesc of tpDef.painPoints) {
              await supabase.from("pain_points").insert({
                touch_point_id: tp.id,
                description: ppDesc,
                severity: tpDef.emotional_score <= -2 ? "high" : "medium",
                is_ai_generated: true,
              })
            }

            // Highlights
            for (const hlDesc of tpDef.highlights) {
              await supabase.from("highlights").insert({
                touch_point_id: tp.id,
                description: hlDesc,
                impact: tpDef.emotional_score >= 4 ? "high" : "medium",
                is_ai_generated: true,
              })
            }
          }
        }
      }
    }

    // ============================================================
    // 3. ARCHETYPES (CX Methodology: named by behavioral archetype, not human names)
    // ============================================================
    const archetypeDefs = [
      {
        journey_id: journeyIds[0],
        name: "Smart & Savvy",
        role: "Online Shopper",
        subtitle: "Carpe Pretium (Seize the Deal)",
        category: "e-commerce",
        description: "I lead a busy professional life and value my time above all. Shopping online is not just convenience, it is how I reclaim hours in my week. I research thoroughly, compare options, and expect the checkout to be as frictionless as the product discovery.",
        goals_narrative: "My goal is to find the best product at the best price with the least effort. I want accurate delivery dates, transparent pricing, and the confidence that returns will be hassle-free if something does not work out.",
        needs_narrative: "To reach that goal, I compare prices across multiple tabs, read detailed reviews, and look for verified purchase badges. I need filtering that actually works, size guides I can trust, and a cart that remembers where I left off.",
        touchpoints_narrative: "Search engines, Instagram ads, brand websites, comparison aggregators, and mobile apps are my primary channels. I trust peer reviews more than brand copy, and I rely on email order confirmations as my paper trail.",
        goals: ["Find products quickly", "Get accurate delivery estimates", "Easy checkout process", "Transparent total pricing"],
        frustrations: ["Complicated return processes", "Unexpected shipping costs", "Slow page load times", "Out-of-stock after adding to cart"],
        behaviors: ["Compares prices across tabs", "Reads reviews before purchasing", "Shops primarily on mobile during commute", "Uses wishlist as a decision tool"],
        expectations: ["Fast page loads", "Accurate inventory", "Clear return policy", "Multiple payment options"],
        barriers: ["Hidden fees at checkout", "Forced account creation", "Complex size/fit guides", "Slow customer service"],
        drivers: ["Free shipping thresholds", "Flash sales and urgency", "Loyalty rewards", "Social proof and ratings"],
        important_steps: ["Product discovery", "Comparison and filtering", "Cart review", "Checkout and payment"],
        triggers: ["Seasonal sales", "Low stock alerts", "Personalized recommendations", "Abandoned cart emails"],
        mindset: ["Analytical", "Deal-seeking", "Impatient", "Quality-conscious"],
        solution_principles: [
          "Because they research extensively, the experience must be transparent and data-rich, with real-time inventory and honest reviews.",
          "Because they are time-poor, the checkout must be frictionless with saved preferences, one-click ordering, and instant confirmations.",
          "Because they compare across competitors, the experience must emphasize unique value through loyalty perks, price-match guarantees, and exclusive content."
        ],
        value_metric: "2.4B",
        base_percentage: "34%",
        tags: ["e-commerce", "retail", "mobile-first", "deal-seeker"],
      },
      {
        journey_id: journeyIds[1],
        name: "Fresh Start",
        role: "New Banking Customer",
        subtitle: "Initium Novum (A New Beginning)",
        category: "banking",
        description: "I recently relocated and need to rebuild my financial infrastructure from scratch. I am cautious about digital banking because I have never used it as my primary channel. Trust and guidance are paramount.",
        goals_narrative: "I want to open a fully functional account in under 15 minutes without visiting a branch. I need to understand what services are available and get recommendations tailored to someone starting fresh.",
        needs_narrative: "I spend time on forums and comparison sites before committing. I need clear progress indicators during onboarding, jargon-free communication, and reassurance that my data is secure at every step.",
        touchpoints_narrative: "Bank comparison websites, Reddit finance communities, the bank mobile app, branch visits for complex queries, and customer support chat are my main channels.",
        goals: ["Open an account quickly", "Understand available services", "Get personalized recommendations", "Feel secure with my data"],
        frustrations: ["Too many form fields", "Lack of progress indicators", "Jargon-heavy communication", "No human fallback option"],
        behaviors: ["Researches on forums before signing up", "Prefers chat over phone support", "Expects mobile app parity with web", "Screenshots terms and conditions"],
        expectations: ["Quick onboarding", "Clear language", "Progress visibility", "Data security assurance"],
        barriers: ["Identity verification friction", "Unclear fee structures", "No branch nearby", "Complex product bundles"],
        drivers: ["Welcome bonuses", "Referral from friends", "Good app store ratings", "Transparent fee structure"],
        important_steps: ["Research and comparison", "Application start", "Identity verification", "First transaction"],
        triggers: ["Relocation", "Life event (marriage, job)", "Dissatisfaction with current bank", "Peer recommendation"],
        mindset: ["Cautious", "Research-driven", "Optimistic", "Value-seeking"],
        solution_principles: [
          "Because they are new and uncertain, the experience must be guided and supportive, with clear next steps and contextual help at every stage.",
          "Because they research extensively, transparent pricing and real customer testimonials must be front and center.",
          "Because they are digitally cautious, security signals and human fallback options must be prominent and reassuring."
        ],
        value_metric: "890M",
        base_percentage: "22%",
        tags: ["fintech", "banking", "onboarding", "trust-seeking"],
      },
      {
        journey_id: journeyIds[2],
        name: "Steady & Strong",
        role: "Healthcare Patient",
        subtitle: "Valetudo Prima (Health Comes First)",
        category: "healthcare",
        description: "I am 55 and managing a chronic condition that requires regular interaction with healthcare services. Technology is not my first instinct but I recognize its potential to simplify my healthcare routine if designed accessibly.",
        goals_narrative: "I want to manage my appointments, access my medical records, and communicate with my care team without feeling overwhelmed. I want to feel in control of my health journey.",
        needs_narrative: "I need large, clear interfaces, straightforward navigation, and the ability to involve my family in managing my care. I need my health data in one place, not scattered across portals.",
        touchpoints_narrative: "Phone calls to the clinic, the patient portal on desktop, pharmacy apps, printed materials from my doctor, and family members who help me navigate digital tools.",
        goals: ["Book appointments easily", "Access medical records", "Communicate with care team", "Involve family in care management"],
        frustrations: ["Long hold times on phone", "Fragmented health records", "Confusing insurance information", "Small text and complex navigation"],
        behaviors: ["Calls clinic before using app", "Relies on family for tech help", "Prefers larger font sizes and clear layouts", "Prints important health documents"],
        expectations: ["Accessible design", "Unified health records", "Easy appointment booking", "Family access controls"],
        barriers: ["Digital literacy gaps", "Multiple provider portals", "Insurance complexity", "Privacy concerns with family access"],
        drivers: ["Fewer clinic visits", "Medication reminders", "Doctor recommendation", "Family encouragement"],
        important_steps: ["Appointment scheduling", "Pre-visit preparation", "Consultation", "Follow-up and medication management"],
        triggers: ["Symptom changes", "Prescription refill needed", "Annual check-up reminder", "Insurance renewal"],
        mindset: ["Cautious", "Dependent on routine", "Family-oriented", "Resilient"],
        solution_principles: [
          "Because they have accessibility needs, the experience must be designed with large touch targets, high contrast, and clear hierarchy that works for all abilities.",
          "Because they rely on family, the experience must support delegated access and shared care management without compromising privacy.",
          "Because their health data is fragmented, the experience must aggregate records into a single, trustworthy view that reduces cognitive load."
        ],
        value_metric: "1.2B",
        base_percentage: "18%",
        tags: ["healthcare", "accessibility", "chronic-care", "family-care"],
      },
    ]

    const archetypeIds: string[] = []
    for (const archDef of archetypeDefs) {
      const { data: arc, error: arcErr } = await supabase.from("archetypes").insert(archDef).select("id").single()
      if (arcErr) throw arcErr
      archetypeIds.push(arc.id)
    }

    // --- PILLAR RATINGS for each archetype (10 CX Pillars: 5 Higher Order + 5 Basic Order) ---
    const pillarRatingsDefs = [
      // Archetype 1: Smart & Savvy
      { archetype_id: archetypeIds[0], name: "Recognition", score: 6, group: "higher_order" },
      { archetype_id: archetypeIds[0], name: "Integrity", score: 8, group: "higher_order" },
      { archetype_id: archetypeIds[0], name: "Expectations", score: 9, group: "higher_order" },
      { archetype_id: archetypeIds[0], name: "Empathy", score: 5, group: "higher_order" },
      { archetype_id: archetypeIds[0], name: "Emotions", score: 4, group: "higher_order" },
      { archetype_id: archetypeIds[0], name: "Resolution", score: 7, group: "basic_order" },
      { archetype_id: archetypeIds[0], name: "Speed", score: 9, group: "basic_order" },
      { archetype_id: archetypeIds[0], name: "Effort", score: 8, group: "basic_order" },
      { archetype_id: archetypeIds[0], name: "Enablement", score: 6, group: "basic_order" },
      { archetype_id: archetypeIds[0], name: "Convenience", score: 10, group: "basic_order" },
      // Archetype 2: Fresh Start
      { archetype_id: archetypeIds[1], name: "Recognition", score: 4, group: "higher_order" },
      { archetype_id: archetypeIds[1], name: "Integrity", score: 9, group: "higher_order" },
      { archetype_id: archetypeIds[1], name: "Expectations", score: 7, group: "higher_order" },
      { archetype_id: archetypeIds[1], name: "Empathy", score: 8, group: "higher_order" },
      { archetype_id: archetypeIds[1], name: "Emotions", score: 6, group: "higher_order" },
      { archetype_id: archetypeIds[1], name: "Resolution", score: 5, group: "basic_order" },
      { archetype_id: archetypeIds[1], name: "Speed", score: 7, group: "basic_order" },
      { archetype_id: archetypeIds[1], name: "Effort", score: 6, group: "basic_order" },
      { archetype_id: archetypeIds[1], name: "Enablement", score: 8, group: "basic_order" },
      { archetype_id: archetypeIds[1], name: "Convenience", score: 7, group: "basic_order" },
      // Archetype 3: Steady & Strong
      { archetype_id: archetypeIds[2], name: "Recognition", score: 5, group: "higher_order" },
      { archetype_id: archetypeIds[2], name: "Integrity", score: 9, group: "higher_order" },
      { archetype_id: archetypeIds[2], name: "Expectations", score: 6, group: "higher_order" },
      { archetype_id: archetypeIds[2], name: "Empathy", score: 10, group: "higher_order" },
      { archetype_id: archetypeIds[2], name: "Emotions", score: 8, group: "higher_order" },
      { archetype_id: archetypeIds[2], name: "Resolution", score: 8, group: "basic_order" },
      { archetype_id: archetypeIds[2], name: "Speed", score: 5, group: "basic_order" },
      { archetype_id: archetypeIds[2], name: "Effort", score: 4, group: "basic_order" },
      { archetype_id: archetypeIds[2], name: "Enablement", score: 9, group: "basic_order" },
      { archetype_id: archetypeIds[2], name: "Convenience", score: 7, group: "basic_order" },
    ]

    for (const pr of pillarRatingsDefs) {
      await supabase.from("pillar_ratings").insert(pr)
    }

    // --- RADAR CHARTS for each archetype ---
    const radarChartDefs = [
      { archetype_id: archetypeIds[0], label: "Values" },
      { archetype_id: archetypeIds[0], label: "Channels" },
      { archetype_id: archetypeIds[1], label: "Needs" },
      { archetype_id: archetypeIds[1], label: "Channels" },
      { archetype_id: archetypeIds[2], label: "Care Priorities" },
      { archetype_id: archetypeIds[2], label: "Channels" },
    ]

    const radarChartIds: string[] = []
    for (const rc of radarChartDefs) {
      const { data: rcData, error: rcErr } = await supabase.from("radar_charts").insert(rc).select("id").single()
      if (rcErr) throw rcErr
      radarChartIds.push(rcData.id)
    }

    // Radar dimensions for each chart
    const radarDimDefs = [
      // Smart & Savvy - Values
      { radar_chart_id: radarChartIds[0], axis: "Price", value: 90 },
      { radar_chart_id: radarChartIds[0], axis: "Speed", value: 85 },
      { radar_chart_id: radarChartIds[0], axis: "Quality", value: 70 },
      { radar_chart_id: radarChartIds[0], axis: "Trust", value: 65 },
      { radar_chart_id: radarChartIds[0], axis: "Convenience", value: 95 },
      { radar_chart_id: radarChartIds[0], axis: "Selection", value: 80 },
      // Smart & Savvy - Channels
      { radar_chart_id: radarChartIds[1], axis: "Mobile App", value: 90 },
      { radar_chart_id: radarChartIds[1], axis: "Website", value: 75 },
      { radar_chart_id: radarChartIds[1], axis: "Social", value: 60 },
      { radar_chart_id: radarChartIds[1], axis: "Email", value: 50 },
      { radar_chart_id: radarChartIds[1], axis: "In-Store", value: 20 },
      { radar_chart_id: radarChartIds[1], axis: "Search", value: 85 },
      // Fresh Start - Needs
      { radar_chart_id: radarChartIds[2], axis: "Guidance", value: 95 },
      { radar_chart_id: radarChartIds[2], axis: "Security", value: 90 },
      { radar_chart_id: radarChartIds[2], axis: "Simplicity", value: 85 },
      { radar_chart_id: radarChartIds[2], axis: "Speed", value: 60 },
      { radar_chart_id: radarChartIds[2], axis: "Personalization", value: 50 },
      { radar_chart_id: radarChartIds[2], axis: "Transparency", value: 88 },
      // Fresh Start - Channels
      { radar_chart_id: radarChartIds[3], axis: "Mobile App", value: 70 },
      { radar_chart_id: radarChartIds[3], axis: "Website", value: 80 },
      { radar_chart_id: radarChartIds[3], axis: "Branch", value: 40 },
      { radar_chart_id: radarChartIds[3], axis: "Chat", value: 85 },
      { radar_chart_id: radarChartIds[3], axis: "Forums", value: 75 },
      { radar_chart_id: radarChartIds[3], axis: "Email", value: 55 },
      // Steady & Strong - Care Priorities
      { radar_chart_id: radarChartIds[4], axis: "Accessibility", value: 95 },
      { radar_chart_id: radarChartIds[4], axis: "Trust", value: 90 },
      { radar_chart_id: radarChartIds[4], axis: "Simplicity", value: 92 },
      { radar_chart_id: radarChartIds[4], axis: "Family", value: 88 },
      { radar_chart_id: radarChartIds[4], axis: "Continuity", value: 85 },
      { radar_chart_id: radarChartIds[4], axis: "Speed", value: 40 },
      // Steady & Strong - Channels
      { radar_chart_id: radarChartIds[5], axis: "Phone", value: 90 },
      { radar_chart_id: radarChartIds[5], axis: "Portal", value: 55 },
      { radar_chart_id: radarChartIds[5], axis: "In-Person", value: 80 },
      { radar_chart_id: radarChartIds[5], axis: "Family Proxy", value: 75 },
      { radar_chart_id: radarChartIds[5], axis: "Pharmacy App", value: 45 },
      { radar_chart_id: radarChartIds[5], axis: "Print", value: 70 },
    ]

    for (const dim of radarDimDefs) {
      await supabase.from("radar_dimensions").insert(dim)
    }

    // ============================================================
    // 4. COMMENTS (pain point comments across journeys)
    // ============================================================
    // Get some touchpoints to add comments to
    const { data: allStages } = await supabase
      .from("stages")
      .select("id, journey_id, name")
      .in("journey_id", journeyIds)
      .order("order")

    const { data: allSteps } = await supabase
      .from("steps")
      .select("id, stage_id")
      .in("stage_id", (allStages || []).map((s) => s.id))

    const commentDefs = [
      { journey_id: journeyIds[0], text: "The checkout abandonment rate at this stage is 34%. We need to address the forced account creation issue urgently.", author_name: "Product Team" },
      { journey_id: journeyIds[0], text: "Customer feedback survey shows returns process is the #1 complaint. Suggest implementing self-service returns portal.", author_name: "CX Research" },
      { journey_id: journeyIds[1], text: "KYC completion rate improved to 92% after the AI-powered ID scan implementation. Great progress on reducing friction.", author_name: "Growth Team" },
      { journey_id: journeyIds[2], text: "Patient satisfaction scores dropped 12% in the billing stage. Insurance claim transparency is the key issue.", author_name: "Patient Experience" },
      { journey_id: journeyIds[2], text: "Telehealth adoption reached 60% of eligible appointments. Consider expanding to specialist consultations.", author_name: "Digital Health Team" },
    ]

    for (const cDef of commentDefs) {
      const stage = (allStages || []).find((s) => s.journey_id === cDef.journey_id)
      const step = stage ? (allSteps || []).find((st) => st.stage_id === stage.id) : null
      if (stage) {
        await supabase.from("comments").insert({
          journey_id: cDef.journey_id,
          stage_id: stage.id,
          step_id: step?.id || null,
          author_id: user.id,
          body: cDef.text,
          type: "note",
        })
      }
    }

    // ============================================================
    // 5. JOURNEY VERSIONS
    // ============================================================
    for (let i = 0; i < journeyIds.length; i++) {
      await supabase.from("journey_versions").insert({
        journey_id: journeyIds[i],
        version_number: 1,
        label: "Initial mapping",
        snapshot: { seeded: true, journey_index: i },
        created_by: user.id,
      })
    }

    // ============================================================
    // 6. ROADMAP INITIATIVES
    // ============================================================
    const roadmapDefs = [
      { title: "Self-Service Returns Portal", description: "Build automated returns portal to reduce support calls by 40%", journey_id: journeyIds[0], priority: 1, status: "in_progress", responsible: "Product Team", accountable: "VP of CX", consulted: "Engineering, Design", informed: "Executive Team", start_date: "2026-01-15", end_date: "2026-04-30" },
      { title: "Guest Checkout Implementation", description: "Remove forced account creation from purchase flow", journey_id: journeyIds[0], priority: 2, status: "completed", responsible: "Frontend Engineering", accountable: "Product Manager", consulted: "UX Research", informed: "Marketing", start_date: "2025-11-01", end_date: "2026-01-10" },
      { title: "Gen Z Marketing Campaign", description: "Influencer partnership program for banking app launch", journey_id: journeyIds[1], priority: 3, status: "planned", responsible: "Marketing", accountable: "CMO", consulted: "Brand, Legal", informed: "Executive Team", start_date: "2026-03-01", end_date: "2026-06-30" },
      { title: "Plain-Language Lab Results", description: "AI-powered translation of medical results to patient-friendly language", journey_id: journeyIds[2], priority: 1, status: "pending_approval", responsible: "Clinical Informatics", accountable: "Chief Medical Officer", consulted: "Legal, Compliance", informed: "Patient Advisory Board", start_date: "2026-02-01", end_date: "2026-05-31" },
    ]

    for (const rmDef of roadmapDefs) {
      await supabase.from("roadmap_initiatives").insert({
        ...rmDef,
        organization_id: orgId,
      })
    }

    // ============================================================
    // 7. SOLUTIONS
    // ============================================================
    const solutionDefs = [
      { title: "One-Click Guest Checkout", description: "Allow purchases without account creation by collecting only essential information (email + shipping). Offer optional account creation post-purchase with saved order history as incentive.", category: "behavioral", source: "CX Research Lab", tags: ["checkout", "e-commerce", "friction-reduction"], relevance: 92, upvotes: 24, saved: false, is_crowd: false, industry: "e-commerce", applicable_stage: "Purchase", created_by: user.id },
      { title: "Smart Returns Kiosk", description: "Self-service return stations in partner locations (pharmacies, convenience stores) with QR code-based returns. Instant refund to original payment method upon drop-off.", category: "industrial", source: "Retail Innovation Forum", tags: ["returns", "self-service", "retail"], relevance: 85, upvotes: 18, saved: false, is_crowd: false, industry: "e-commerce", applicable_stage: "Post-Purchase", created_by: user.id },
      { title: "AI Spending Coach", description: "Proactive AI assistant that analyzes spending patterns and suggests personalized savings rules. Uses behavioral nudges to encourage positive financial habits without being preachy.", category: "technological", source: "Fintech Weekly", tags: ["ai", "banking", "savings", "nudge"], relevance: 88, upvotes: 31, saved: false, is_crowd: false, industry: "banking", applicable_stage: "Engagement", created_by: user.id },
      { title: "60-Second KYC with Liveness Detection", description: "AI-powered identity verification using document scanning and real-time liveness detection. Reduces onboarding friction while maintaining compliance standards.", category: "technological", source: "RegTech Insights", tags: ["kyc", "ai", "onboarding", "compliance"], relevance: 80, upvotes: 15, saved: false, is_crowd: false, industry: "banking", applicable_stage: "Registration", created_by: user.id },
      { title: "Patient Health Timeline", description: "Visual timeline showing all healthcare interactions, test results, and treatments in chronological order with plain-language summaries. Helps patients understand their health journey at a glance.", category: "behavioral", source: "Healthcare UX Review", tags: ["health", "timeline", "patient-experience"], relevance: 90, upvotes: 22, saved: false, is_crowd: false, industry: "healthcare", applicable_stage: "Treatment", created_by: user.id },
      { title: "Smart Appointment Matching", description: "AI-powered scheduling that considers patient preferences, travel time, provider availability, and urgency to suggest optimal appointment slots.", category: "technological", source: "Digital Health Weekly", tags: ["ai", "scheduling", "healthcare"], relevance: 78, upvotes: 12, saved: false, is_crowd: false, industry: "healthcare", applicable_stage: "Scheduling", created_by: user.id },
      { title: "Community Checkout Optimization", description: "Crowd-sourced solution: simplified checkout flow tested by 200+ beta users. Reduced cart abandonment by 23% through progressive disclosure and inline validation.", category: "behavioral", source: "Beta Community", tags: ["checkout", "community", "ux-testing"], relevance: 75, upvotes: 8, saved: false, is_crowd: true, industry: "e-commerce", applicable_stage: "Purchase", contributor_org: "CX Community Network", created_by: user.id },
      { title: "Peer-to-Peer Financial Mentoring", description: "Community-driven financial literacy program where experienced users mentor newcomers through in-app messaging and shared goal tracking.", category: "social", source: "User Community", tags: ["mentoring", "financial-literacy", "p2p"], relevance: 72, upvotes: 14, saved: false, is_crowd: true, industry: "banking", applicable_stage: "Engagement", contributor_org: "FinLit Community", created_by: user.id },
    ]

    for (const sDef of solutionDefs) {
      await supabase.from("solutions").insert({ ...sDef, published_at: new Date().toISOString() })
    }

    return NextResponse.json({
      success: true,
      created: {
        journeys: journeyIds.length,
        archetypes: archetypeDefs.length,
        comments: commentDefs.length,
        roadmapInitiatives: roadmapDefs.length,
        solutions: solutionDefs.length,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
