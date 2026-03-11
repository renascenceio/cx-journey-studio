-- Seed solutions only if table is empty
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.solutions LIMIT 1) THEN
    RAISE NOTICE 'Solutions already exist, skipping';
    RETURN;
  END IF;

  INSERT INTO public.solutions (title, category, description, source, tags, relevance, upvotes, is_crowd, industry, contributor_org) VALUES
    ('Proactive Chat Triggers', 'technological', 'Deploy context-aware chat triggers based on user behavior signals like hesitation or cart inactivity.', 'Forrester Research 2025', ARRAY['chat','engagement','conversion'], 92, 47, false, NULL, NULL),
    ('Emotional Journey Mapping', 'behavioral', 'Overlay emotional valence data onto journey stages using micro-surveys and facial coding analysis.', 'Harvard Business Review', ARRAY['emotion','mapping','research'], 88, 38, false, NULL, NULL),
    ('Service Recovery Rituals', 'rituals', 'Structured service recovery protocols that turn negative experiences into loyalty-building moments.', 'CX Professionals Assoc.', ARRAY['service-recovery','loyalty','retention'], 85, 52, false, NULL, NULL),
    ('Omnichannel Handoff Protocol', 'industrial', 'Seamless transition protocols between digital and physical touchpoints with context-passing standards.', 'McKinsey Digital', ARRAY['omnichannel','handoff','continuity'], 82, 29, false, NULL, NULL),
    ('Social Proof Micro-Moments', 'social', 'Inject contextual social proof at key decision points. Most effective at consideration and purchase stages.', 'Behavioral Science Lab', ARRAY['social-proof','conversion','trust'], 79, 41, false, NULL, NULL),
    ('Sustainable Packaging Journey', 'environmental', 'Re-engineer the unboxing experience to minimize waste while maximizing delight.', 'GreenBiz Insights', ARRAY['sustainability','packaging','eco'], 75, 33, false, NULL, NULL),
    ('AI-Powered Next Best Action', 'technological', 'ML models trained on journey data recommend optimal next interactions. 23% average conversion lift.', 'Gartner CX Report', ARRAY['ai','ml','personalization'], 91, 61, false, NULL, NULL),
    ('Habit Loop Design', 'behavioral', 'Apply Cue-Routine-Reward framework to design sticky product experiences.', 'Nir Eyal / Hooked', ARRAY['habits','engagement','retention'], 86, 44, false, NULL, NULL),
    ('Zero-Friction Onboarding', 'industrial', 'Progressive disclosure onboarding adapting to user proficiency. Eliminates mandatory tutorials.', 'Product-Led Growth Institute', ARRAY['onboarding','plg','activation'], 90, 55, false, NULL, NULL),
    ('Community Co-Creation Loops', 'social', 'Feedback loops where customers actively participate in journey improvement.', 'IDEO Design Thinking', ARRAY['community','co-creation','feedback'], 77, 28, false, NULL, NULL),
    ('Wait Time Transparency Board', 'rituals', 'Digital displays with real-time wait estimates reduced perceived wait time by 40%.', 'Crowd Contribution', ARRAY['wait-time','transparency','retail'], 73, 19, true, 'Retail', 'Nordstrom CX Team'),
    ('Empathy-First Escalation', 'behavioral', 'Retrained support team to lead with emotional acknowledgment. CSAT improved 18 points.', 'Crowd Contribution', ARRAY['empathy','support','escalation'], 80, 35, true, 'SaaS', 'Zendesk Community'),
    ('QR Feedback Tokens', 'technological', 'Physical QR tokens at checkout linking to feedback form. 4x higher response rate.', 'Crowd Contribution', ARRAY['feedback','qr','survey'], 71, 22, true, 'Hospitality', 'Marriott Innovation Lab'),
    ('Cross-Dept Journey Councils', 'industrial', 'Monthly cross-functional councils reviewing journey health. Broke silo problem in one quarter.', 'Crowd Contribution', ARRAY['collaboration','cross-functional','governance'], 76, 31, true, 'Enterprise', 'Salesforce CX Ops'),
    ('Green Points Loyalty Tier', 'environmental', 'Sustainability-linked loyalty tier rewarding eco-friendly choices. 28% opt-in in first month.', 'Crowd Contribution', ARRAY['loyalty','sustainability','rewards'], 68, 17, true, 'Retail', 'Patagonia Community'),
    ('Peer Support Networks', 'social', 'Customer-to-customer support forums. Resolved 35% of tickets without agent involvement.', 'Crowd Contribution', ARRAY['community','peer-support','self-service'], 74, 26, true, 'SaaS', 'Atlassian Community');
END $$;
