-- ========================================
-- CX Journey Mapping Studio - Database Schema
-- ========================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =====================
-- Organizations
-- =====================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

-- =====================
-- Profiles (linked to auth.users)
-- =====================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar text,
  role text not null default 'contributor' check (role in ('journey_master', 'contributor', 'viewer', 'external')),
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================
-- Teams
-- =====================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

-- =====================
-- Journeys
-- =====================
create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'current' check (type in ('template', 'current', 'future', 'deployed')),
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'review', 'approved', 'deployed', 'archived')),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  tags text[] not null default '{}',
  health_status text check (health_status in ('healthy', 'warning', 'critical', 'unknown')),
  last_health_check timestamptz,
  linked_current_journey_id uuid references public.journeys(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- Collaborators
-- =====================
create table if not exists public.collaborators (
  journey_id uuid not null references public.journeys(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor' check (role in ('journey_master', 'contributor', 'viewer', 'external')),
  added_at timestamptz not null default now(),
  primary key (journey_id, user_id)
);

-- =====================
-- Stages
-- =====================
create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  name text not null,
  "order" int not null default 0
);

-- =====================
-- Steps
-- =====================
create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  name text not null,
  description text,
  "order" int not null default 0
);

-- =====================
-- Touch Points
-- =====================
create table if not exists public.touch_points (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.steps(id) on delete cascade,
  channel text not null,
  description text not null,
  emotional_score int not null default 0 check (emotional_score between -5 and 5)
);

-- =====================
-- Pain Points
-- =====================
create table if not exists public.pain_points (
  id uuid primary key default gen_random_uuid(),
  touch_point_id uuid not null references public.touch_points(id) on delete cascade,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical'))
);

-- =====================
-- Highlights
-- =====================
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  touch_point_id uuid not null references public.touch_points(id) on delete cascade,
  description text not null,
  impact text not null default 'medium' check (impact in ('low', 'medium', 'high'))
);

-- =====================
-- Evidence
-- =====================
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  touch_point_id uuid not null references public.touch_points(id) on delete cascade,
  type text not null check (type in ('screenshot', 'recording', 'survey', 'analytics', 'document')),
  url text not null,
  label text not null
);

-- =====================
-- Archetypes
-- =====================
create table if not exists public.archetypes (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  name text not null,
  role text not null,
  subtitle text,
  category text not null default 'e-commerce' check (category in ('e-commerce', 'banking', 'healthcare', 'saas', 'real_estate', 'insurance', 'hospitality', 'telecommunications')),
  avatar text,
  -- Narrative fields
  description text not null default '',
  goals_narrative text not null default '',
  needs_narrative text not null default '',
  touchpoints_narrative text not null default '',
  -- List fields stored as text arrays
  goals text[] not null default '{}',
  frustrations text[] not null default '{}',
  behaviors text[] not null default '{}',
  expectations text[] not null default '{}',
  barriers text[] not null default '{}',
  drivers text[] not null default '{}',
  important_steps text[] not null default '{}',
  triggers text[] not null default '{}',
  mindset text[] not null default '{}',
  solution_principles text[] not null default '{}',
  -- Metrics
  value_metric text,
  base_percentage text,
  tags text[] not null default '{}'
);

-- =====================
-- Pillar Ratings (for archetypes)
-- =====================
create table if not exists public.pillar_ratings (
  id uuid primary key default gen_random_uuid(),
  archetype_id uuid not null references public.archetypes(id) on delete cascade,
  name text not null,
  score numeric(4,1) not null default 0 check (score between 0 and 10),
  "group" text not null check ("group" in ('higher_order', 'basic_order'))
);

-- =====================
-- Radar Chart Data (for archetypes)
-- =====================
create table if not exists public.radar_charts (
  id uuid primary key default gen_random_uuid(),
  archetype_id uuid not null references public.archetypes(id) on delete cascade,
  label text not null
);

create table if not exists public.radar_dimensions (
  id uuid primary key default gen_random_uuid(),
  radar_chart_id uuid not null references public.radar_charts(id) on delete cascade,
  axis text not null,
  value numeric(5,1) not null default 0 check (value between 0 and 100)
);

-- =====================
-- Comments
-- =====================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  mentions text[] not null default '{}',
  resolved boolean not null default false,
  parent_id uuid references public.comments(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  step_id uuid references public.steps(id) on delete set null,
  reactions jsonb not null default '[]',
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================
-- Activity Log
-- =====================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('created', 'edited', 'commented', 'status_changed', 'deployed', 'shared', 'archived', 'mentioned_you')),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  journey_id uuid references public.journeys(id) on delete cascade,
  details text not null default '',
  stage_id uuid references public.stages(id) on delete set null,
  step_id uuid references public.steps(id) on delete set null,
  comment_preview text,
  timestamp timestamptz not null default now()
);

-- =====================
-- Journey Versions (snapshots stored as JSONB)
-- =====================
create table if not exists public.journey_versions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  version_number int not null,
  label text,
  snapshot jsonb not null default '{}',
  created_by uuid not null references public.profiles(id) on delete cascade,
  changes_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (journey_id, version_number)
);

-- =====================
-- Notifications
-- =====================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('comment', 'mention', 'status_change', 'share', 'health_alert', 'system')),
  message text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- =====================
-- Solutions / Trends
-- =====================
create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('behavioral', 'rituals', 'industrial', 'technological', 'social', 'environmental')),
  description text not null,
  source text not null,
  tags text[] not null default '{}',
  relevance int not null default 50 check (relevance between 0 and 100),
  upvotes int not null default 0,
  saved boolean not null default false,
  published_at timestamptz not null default now(),
  is_crowd boolean not null default false,
  industry text,
  applicable_stage text,
  contributor_org text
);

-- =====================
-- Indexes for common query patterns
-- =====================
create index if not exists idx_journeys_org on public.journeys(organization_id);
create index if not exists idx_journeys_team on public.journeys(team_id);
create index if not exists idx_journeys_owner on public.journeys(owner_id);
create index if not exists idx_stages_journey on public.stages(journey_id);
create index if not exists idx_steps_stage on public.steps(stage_id);
create index if not exists idx_touch_points_step on public.touch_points(step_id);
create index if not exists idx_pain_points_tp on public.pain_points(touch_point_id);
create index if not exists idx_highlights_tp on public.highlights(touch_point_id);
create index if not exists idx_evidence_tp on public.evidence(touch_point_id);
create index if not exists idx_archetypes_journey on public.archetypes(journey_id);
create index if not exists idx_comments_journey on public.comments(journey_id);
create index if not exists idx_activity_journey on public.activity_log(journey_id);
create index if not exists idx_activity_actor on public.activity_log(actor_id);
create index if not exists idx_versions_journey on public.journey_versions(journey_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_collaborators_user on public.collaborators(user_id);

-- =====================
-- Auto-create profile on signup trigger
-- =====================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'contributor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =====================
-- Auto-update updated_at on journeys
-- =====================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journeys_updated_at on public.journeys;
create trigger journeys_updated_at
  before update on public.journeys
  for each row
  execute function public.update_updated_at();
