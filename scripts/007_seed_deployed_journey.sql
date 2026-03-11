-- Seed a deployed journey for demo purposes
DO $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_journey_id uuid;
  v_stage_id uuid;
  v_step_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
  SELECT id INTO v_workspace_id FROM public.workspaces LIMIT 1;

  IF v_user_id IS NULL OR v_workspace_id IS NULL THEN
    RETURN;
  END IF;

  -- Skip if a deployed journey already exists
  IF EXISTS (SELECT 1 FROM public.journeys WHERE type = 'deployed') THEN
    RETURN;
  END IF;

  -- Create deployed journey
  INSERT INTO public.journeys (title, type, status, description, owner_id, workspace_id)
  VALUES ('E-Commerce Purchase Flow (Live)', 'deployed', 'deployed', 'The currently deployed customer purchase journey, live since Q3 2025.', v_user_id, v_workspace_id)
  RETURNING id INTO v_journey_id;

  -- Stage 1: Discovery
  INSERT INTO public.stages (journey_id, name, "order") VALUES (v_journey_id, 'Discovery', 0) RETURNING id INTO v_stage_id;
  INSERT INTO public.steps (stage_id, name, description, "order") VALUES (v_stage_id, 'Search & Browse', 'Customer searches for products via organic search or paid ads', 0) RETURNING id INTO v_step_id;
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'Web', 'Product listing page with filters', 3);
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'Mobile App', 'Mobile-optimized browse experience', 2);

  -- Stage 2: Consideration
  INSERT INTO public.stages (journey_id, name, "order") VALUES (v_journey_id, 'Consideration', 1) RETURNING id INTO v_stage_id;
  INSERT INTO public.steps (stage_id, name, description, "order") VALUES (v_stage_id, 'Compare Options', 'Customer compares products and reads reviews', 0) RETURNING id INTO v_step_id;
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'Web', 'Product detail page with reviews', 1);
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'Email', 'Abandoned browse recovery email', -1);

  -- Stage 3: Purchase
  INSERT INTO public.stages (journey_id, name, "order") VALUES (v_journey_id, 'Purchase', 2) RETURNING id INTO v_stage_id;
  INSERT INTO public.steps (stage_id, name, description, "order") VALUES (v_stage_id, 'Checkout & Payment', 'Customer completes cart and confirms order', 0) RETURNING id INTO v_step_id;
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'Web', 'One-page checkout with saved payment', 4);
  INSERT INTO public.touch_points (step_id, channel, description, emotional_score) VALUES (v_step_id, 'SMS', 'Order confirmation and tracking', 3);

END $$;
