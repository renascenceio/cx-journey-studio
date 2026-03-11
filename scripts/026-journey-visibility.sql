-- Add is_public column to journeys
ALTER TABLE public.journeys 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Add upvote_count column to journeys  
ALTER TABLE public.journeys 
ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;

-- Create journey_upvotes table
CREATE TABLE IF NOT EXISTS public.journey_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, user_id)
);

-- Enable RLS on journey_upvotes
ALTER TABLE public.journey_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for upvotes
DROP POLICY IF EXISTS "upvotes_select" ON public.journey_upvotes;
CREATE POLICY "upvotes_select" ON public.journey_upvotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "upvotes_insert" ON public.journey_upvotes;
CREATE POLICY "upvotes_insert" ON public.journey_upvotes FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "upvotes_delete" ON public.journey_upvotes;
CREATE POLICY "upvotes_delete" ON public.journey_upvotes FOR DELETE USING (user_id = auth.uid());
