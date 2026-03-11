-- ============================================================
-- SEED DATA: Demo content for CX Journey Mapping Platform
-- ============================================================

-- 1. Create demo auth user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'demo@cxjourney.app',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Alex Rivera"}',
  'authenticated',
  'authenticated',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Also add identity for login
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  '{"sub":"c0000000-0000-0000-0000-000000000001","email":"demo@cxjourney.app"}',
  'email',
  'c0000000-0000-0000-0000-000000000001',
  now(), now(), now()
) ON CONFLICT DO NOTHING;

-- 2. Create profile
INSERT INTO profiles (id, name, email, avatar, role, organization_id, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Alex Rivera', 'demo@cxjourney.app', NULL, 'admin', 'a0000000-0000-0000-0000-000000000001', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. JOURNEYS
-- ============================================================

-- Journey 1: Current State - E-Commerce Purchase
INSERT INTO journeys (id, title, description, type, status, owner_id, organization_id, team_id, tags, health_status, last_health_check, created_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'E-Commerce Purchase Journey',
   'End-to-end customer experience from product discovery through post-purchase support for our e-commerce platform.',
   'current', 'active',
   'c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   ARRAY['e-commerce','purchase','retail'],
   'needs_attention', now() - interval '2 days',
   now() - interval '30 days', now() - interval '1 day');

-- Journey 2: Future State - Omnichannel Onboarding
INSERT INTO journeys (id, title, description, type, status, owner_id, organization_id, team_id, tags, health_status, last_health_check, created_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000002',
   'Omnichannel Onboarding Journey',
   'Future-state design for a seamless onboarding experience spanning mobile, web, and in-store touchpoints.',
   'future', 'draft',
   'c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   ARRAY['onboarding','omnichannel','future-state'],
   'healthy', now() - interval '1 day',
   now() - interval '14 days', now() - interval '3 days');

-- Journey 3: Current State - Customer Support Resolution
INSERT INTO journeys (id, title, description, type, status, owner_id, organization_id, team_id, tags, health_status, last_health_check, linked_current_journey_id, created_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000003',
   'Customer Support Resolution Journey',
   'Mapping the end-to-end support experience from issue identification to resolution and follow-up.',
   'current', 'active',
   'c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   ARRAY['support','service','resolution'],
   'at_risk', now() - interval '5 days',
   now() - interval '45 days', now() - interval '2 days');

-- ============================================================
-- 4. STAGES (3-5 per journey)
-- ============================================================

-- Journey 1 stages
INSERT INTO stages (id, journey_id, name, "order") VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Discovery', 0),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Consideration', 1),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Purchase', 2),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Delivery', 3),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Post-Purchase', 4);

-- Journey 2 stages
INSERT INTO stages (id, journey_id, name, "order") VALUES
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'Awareness', 0),
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000002', 'Sign-Up', 1),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 'First Experience', 2),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000002', 'Activation', 3);

-- Journey 3 stages
INSERT INTO stages (id, journey_id, name, "order") VALUES
  ('e0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000003', 'Issue Identification', 0),
  ('e0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000003', 'Contact & Triage', 1),
  ('e0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000003', 'Resolution', 2),
  ('e0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000003', 'Follow-Up', 3);

-- ============================================================
-- 5. STEPS (2-3 per stage)
-- ============================================================

-- Journey 1 / Discovery
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Search & Browse', 'Customer searches for products via search engine or site navigation', 0),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'View Recommendations', 'Customer sees personalized product recommendations', 1);
-- Journey 1 / Consideration
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'Compare Products', 'Customer compares features, reviews, and pricing', 0),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'Read Reviews', 'Customer reads user reviews and ratings', 1),
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'Add to Cart', 'Customer adds selected items to shopping cart', 2);
-- Journey 1 / Purchase
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'Checkout', 'Customer proceeds through checkout flow', 0),
  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'Payment', 'Customer enters payment details and confirms', 1);
-- Journey 1 / Delivery
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000004', 'Order Tracking', 'Customer tracks shipment status', 0),
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000004', 'Receive Package', 'Customer receives and opens delivery', 1);
-- Journey 1 / Post-Purchase
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000005', 'Product Setup', 'Customer sets up or starts using the product', 0),
  ('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000005', 'Leave Review', 'Customer leaves a review or rating', 1);

-- Journey 2 / Awareness
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000021', 'e0000000-0000-0000-0000-000000000011', 'See Advertisement', 'Prospect encounters brand via ad or referral', 0),
  ('f0000000-0000-0000-0000-000000000022', 'e0000000-0000-0000-0000-000000000011', 'Visit Landing Page', 'Prospect visits website landing page', 1);
-- Journey 2 / Sign-Up
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000023', 'e0000000-0000-0000-0000-000000000012', 'Create Account', 'User creates account via web or mobile', 0),
  ('f0000000-0000-0000-0000-000000000024', 'e0000000-0000-0000-0000-000000000012', 'Verify Email', 'User verifies email address', 1);
-- Journey 2 / First Experience
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000025', 'e0000000-0000-0000-0000-000000000013', 'Welcome Tour', 'User goes through guided product tour', 0),
  ('f0000000-0000-0000-0000-000000000026', 'e0000000-0000-0000-0000-000000000013', 'Complete First Task', 'User completes their first meaningful action', 1);
-- Journey 2 / Activation
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000027', 'e0000000-0000-0000-0000-000000000014', 'Set Preferences', 'User customizes their experience', 0),
  ('f0000000-0000-0000-0000-000000000028', 'e0000000-0000-0000-0000-000000000014', 'Invite Team', 'User invites colleagues or friends', 1);

-- Journey 3 / Issue Identification
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000031', 'e0000000-0000-0000-0000-000000000021', 'Notice Problem', 'Customer encounters an issue with product/service', 0),
  ('f0000000-0000-0000-0000-000000000032', 'e0000000-0000-0000-0000-000000000021', 'Search Self-Help', 'Customer searches FAQ/knowledge base', 1);
-- Journey 3 / Contact & Triage
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000033', 'e0000000-0000-0000-0000-000000000022', 'Contact Support', 'Customer reaches out via chat/phone/email', 0),
  ('f0000000-0000-0000-0000-000000000034', 'e0000000-0000-0000-0000-000000000022', 'Explain Issue', 'Customer describes their problem to agent', 1);
-- Journey 3 / Resolution
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000035', 'e0000000-0000-0000-0000-000000000023', 'Receive Solution', 'Agent provides resolution steps', 0),
  ('f0000000-0000-0000-0000-000000000036', 'e0000000-0000-0000-0000-000000000023', 'Confirm Fix', 'Customer confirms issue is resolved', 1);
-- Journey 3 / Follow-Up
INSERT INTO steps (id, stage_id, name, description, "order") VALUES
  ('f0000000-0000-0000-0000-000000000037', 'e0000000-0000-0000-0000-000000000024', 'Satisfaction Survey', 'Customer receives follow-up survey', 0),
  ('f0000000-0000-0000-0000-000000000038', 'e0000000-0000-0000-0000-000000000024', 'Loyalty Offer', 'Customer receives retention offer', 1);

-- ============================================================
-- 6. TOUCH POINTS (1-2 per step, for key steps)
-- ============================================================

INSERT INTO touch_points (id, step_id, channel, description, emotional_score) VALUES
  -- Journey 1
  ('aa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Web', 'Google search leading to product page', 7),
  ('aa000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Web', 'AI-powered recommendation carousel', 8),
  ('aa000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'Web', 'Side-by-side comparison table', 6),
  ('aa000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'Web', 'Customer review section with photos', 7),
  ('aa000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'Web', 'Add to cart button and mini-cart preview', 8),
  ('aa000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 'Web', 'Multi-step checkout form', 4),
  ('aa000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', 'Web', 'Payment gateway integration', 3),
  ('aa000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', 'Email', 'Order confirmation and tracking emails', 7),
  ('aa000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000008', 'Mobile', 'Push notification for delivery updates', 8),
  ('aa000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000009', 'Physical', 'Unboxing experience with packaging', 9),
  ('aa000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000010', 'Mobile', 'In-app setup wizard', 6),
  ('aa000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000011', 'Email', 'Review request email', 5),
  -- Journey 2
  ('aa000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000021', 'Social', 'Instagram ad with signup CTA', 7),
  ('aa000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', 'Web', 'Landing page with value proposition', 8),
  ('aa000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000023', 'Web', 'One-click social login form', 9),
  ('aa000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000024', 'Email', 'Verification email with magic link', 6),
  ('aa000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000025', 'Mobile', 'Interactive product walkthrough', 8),
  ('aa000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000026', 'Web', 'Guided first-task completion flow', 9),
  ('aa000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000027', 'Mobile', 'Preference selection screen', 7),
  ('aa000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000028', 'Email', 'Team invite email with personalized message', 8),
  -- Journey 3
  ('aa000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000031', 'Physical', 'Product malfunction or defect', 2),
  ('aa000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000032', 'Web', 'Knowledge base search results', 4),
  ('aa000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000033', 'Chat', 'Live chat widget with queue time', 3),
  ('aa000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000033', 'Phone', 'IVR menu then hold music', 2),
  ('aa000000-0000-0000-0000-000000000035', 'f0000000-0000-0000-0000-000000000035', 'Chat', 'Agent provides step-by-step guide', 7),
  ('aa000000-0000-0000-0000-000000000036', 'f0000000-0000-0000-0000-000000000036', 'Chat', 'Customer confirms issue resolved', 8),
  ('aa000000-0000-0000-0000-000000000037', 'f0000000-0000-0000-0000-000000000037', 'Email', 'CSAT survey email', 6),
  ('aa000000-0000-0000-0000-000000000038', 'f0000000-0000-0000-0000-000000000038', 'Email', 'Discount code for next purchase', 7);

-- ============================================================
-- 7. ARCHETYPES (linked to journeys)
-- ============================================================

INSERT INTO archetypes (id, journey_id, name, role, subtitle, category, avatar, age_range, goals, pain_points, behaviors, preferred_channels) VALUES
  ('bb000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'Sarah Chen', 'Tech-Savvy Shopper',
   'Expects fast, seamless digital experiences',
   'primary',
   NULL, '25-34',
   ARRAY['Find best deals quickly', 'Seamless mobile checkout', 'Fast delivery'],
   ARRAY['Slow page loads', 'Complex checkout forms', 'Unclear return policies'],
   ARRAY['Compares prices across platforms', 'Reads reviews before buying', 'Prefers mobile shopping'],
   ARRAY['Mobile', 'Web', 'Email']),
  ('bb000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000001',
   'James Morrison', 'Cautious Buyer',
   'Needs reassurance and detailed information before committing',
   'secondary',
   NULL, '45-54',
   ARRAY['Thorough product research', 'Clear return policy', 'Reliable customer service'],
   ARRAY['Pressure to buy quickly', 'Hidden fees at checkout', 'Poor product descriptions'],
   ARRAY['Reads multiple reviews', 'Contacts support before buying', 'Prefers desktop browsing'],
   ARRAY['Web', 'Phone', 'Email']),
  ('bb000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000003',
   'Maria Lopez', 'Frustrated Customer',
   'Already upset and wants fast, empathetic resolution',
   'primary',
   NULL, '30-44',
   ARRAY['Quick issue resolution', 'Not repeat information', 'Feel heard and valued'],
   ARRAY['Long hold times', 'Being transferred repeatedly', 'Scripted responses'],
   ARRAY['Tries self-service first', 'Prefers chat over phone', 'Will escalate if unresolved'],
   ARRAY['Chat', 'Phone', 'Email']);

-- ============================================================
-- 8. COLLABORATORS
-- ============================================================

INSERT INTO collaborators (journey_id, user_id, role, added_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner', now()),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'owner', now()),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'owner', now());

-- ============================================================
-- 9. ACTIVITY LOG
-- ============================================================

INSERT INTO activity_log (id, action, actor_id, journey_id, details, stage_id, step_id, comment_preview, timestamp) VALUES
  ('cc000000-0000-0000-0000-000000000001', 'journey_created', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Created E-Commerce Purchase Journey', NULL, NULL, NULL, now() - interval '30 days'),
  ('cc000000-0000-0000-0000-000000000002', 'stage_added', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Added 5 stages to the journey', 'e0000000-0000-0000-0000-000000000001', NULL, NULL, now() - interval '29 days'),
  ('cc000000-0000-0000-0000-000000000003', 'touchpoint_added', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Added touch points across all stages', NULL, 'f0000000-0000-0000-0000-000000000001', NULL, now() - interval '28 days'),
  ('cc000000-0000-0000-0000-000000000004', 'comment_added', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Commented on checkout friction', NULL, NULL, 'The checkout flow needs serious work...', now() - interval '20 days'),
  ('cc000000-0000-0000-0000-000000000005', 'journey_created', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Created Omnichannel Onboarding Journey', NULL, NULL, NULL, now() - interval '14 days'),
  ('cc000000-0000-0000-0000-000000000006', 'health_checked', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Health check flagged checkout as needs attention', NULL, NULL, NULL, now() - interval '2 days'),
  ('cc000000-0000-0000-0000-000000000007', 'journey_created', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Created Customer Support Resolution Journey', NULL, NULL, NULL, now() - interval '45 days'),
  ('cc000000-0000-0000-0000-000000000008', 'stage_reordered', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Reordered support journey stages', NULL, NULL, NULL, now() - interval '10 days');

-- ============================================================
-- 10. COMMENTS
-- ============================================================

INSERT INTO comments (id, journey_id, content, author_id, mentions, resolved, parent_id, stage_id, step_id, reactions, edited_at, created_at) VALUES
  ('dd000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'The checkout flow has a 68% drop-off rate at the payment step. We need to simplify the form and add more payment options.',
   'c0000000-0000-0000-0000-000000000001', ARRAY[]::text[], false, NULL,
   'e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000007',
   '[]'::jsonb, NULL, now() - interval '20 days'),
  ('dd000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'Great point. I''ll draft wireframes for a streamlined one-page checkout this week.',
   'c0000000-0000-0000-0000-000000000001', ARRAY[]::text[], false,
   'dd000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000007',
   '[]'::jsonb, NULL, now() - interval '19 days'),
  ('dd000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'The unboxing experience is actually our strongest touchpoint. Customers love the premium packaging.',
   'c0000000-0000-0000-0000-000000000001', ARRAY[]::text[], true, NULL,
   'e0000000-0000-0000-0000-000000000004', NULL,
   '[]'::jsonb, NULL, now() - interval '15 days'),
  ('dd000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
   'Average hold time is 12 minutes. This is unacceptable and driving negative NPS scores.',
   'c0000000-0000-0000-0000-000000000001', ARRAY[]::text[], false, NULL,
   'e0000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000033',
   '[]'::jsonb, NULL, now() - interval '8 days');

-- ============================================================
-- 11. JOURNEY VERSION (snapshot of journey 1)
-- ============================================================

INSERT INTO journey_versions (id, journey_id, version_number, label, snapshot, created_by, changes_summary, created_at) VALUES
  ('ee000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   1, 'Initial Mapping',
   '{"title":"E-Commerce Purchase Journey","stages":5,"steps":11,"touchpoints":12}'::jsonb,
   'c0000000-0000-0000-0000-000000000001',
   'Initial journey mapping with all stages, steps, and touchpoints defined.',
   now() - interval '25 days');
