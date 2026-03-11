-- ========================================
-- Row Level Security Policies
-- ========================================
-- Strategy: Users can access data belonging to their organization.
-- Org membership is determined via profiles.organization_id.

-- Helper: check if current user belongs to a given org
create or replace function public.user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- =====================
-- Organizations
-- =====================
alter table public.organizations enable row level security;

create policy "org_select" on public.organizations
  for select using (id = public.user_org_id());

create policy "org_update" on public.organizations
  for update using (id = public.user_org_id());

-- =====================
-- Profiles
-- =====================
alter table public.profiles enable row level security;

-- Users can see all profiles in their org
create policy "profiles_select" on public.profiles
  for select using (organization_id = public.user_org_id() or id = auth.uid());

-- Users can update their own profile
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid());

-- Insert is handled by the trigger (security definer), but allow self-insert as fallback
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

-- =====================
-- Teams
-- =====================
alter table public.teams enable row level security;

create policy "teams_select" on public.teams
  for select using (organization_id = public.user_org_id());

create policy "teams_insert" on public.teams
  for insert with check (organization_id = public.user_org_id());

create policy "teams_update" on public.teams
  for update using (organization_id = public.user_org_id());

create policy "teams_delete" on public.teams
  for delete using (organization_id = public.user_org_id());

-- =====================
-- Team Members
-- =====================
alter table public.team_members enable row level security;

create policy "team_members_select" on public.team_members
  for select using (
    team_id in (select id from public.teams where organization_id = public.user_org_id())
  );

create policy "team_members_insert" on public.team_members
  for insert with check (
    team_id in (select id from public.teams where organization_id = public.user_org_id())
  );

create policy "team_members_delete" on public.team_members
  for delete using (
    team_id in (select id from public.teams where organization_id = public.user_org_id())
  );

-- =====================
-- Journeys
-- =====================
alter table public.journeys enable row level security;

create policy "journeys_select" on public.journeys
  for select using (organization_id = public.user_org_id());

create policy "journeys_insert" on public.journeys
  for insert with check (organization_id = public.user_org_id());

create policy "journeys_update" on public.journeys
  for update using (organization_id = public.user_org_id());

create policy "journeys_delete" on public.journeys
  for delete using (organization_id = public.user_org_id());

-- =====================
-- Collaborators
-- =====================
alter table public.collaborators enable row level security;

create policy "collaborators_select" on public.collaborators
  for select using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

create policy "collaborators_insert" on public.collaborators
  for insert with check (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

create policy "collaborators_delete" on public.collaborators
  for delete using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

-- =====================
-- Stages (access via journey org)
-- =====================
alter table public.stages enable row level security;

create policy "stages_select" on public.stages
  for select using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

create policy "stages_insert" on public.stages
  for insert with check (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

create policy "stages_update" on public.stages
  for update using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

create policy "stages_delete" on public.stages
  for delete using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
  );

-- =====================
-- Steps (access via stage -> journey org)
-- =====================
alter table public.steps enable row level security;

create policy "steps_select" on public.steps
  for select using (
    stage_id in (
      select s.id from public.stages s
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "steps_insert" on public.steps
  for insert with check (
    stage_id in (
      select s.id from public.stages s
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "steps_update" on public.steps
  for update using (
    stage_id in (
      select s.id from public.stages s
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "steps_delete" on public.steps
  for delete using (
    stage_id in (
      select s.id from public.stages s
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

-- =====================
-- Touch Points (access via step -> stage -> journey org)
-- =====================
alter table public.touch_points enable row level security;

create policy "touch_points_select" on public.touch_points
  for select using (
    step_id in (
      select st.id from public.steps st
      join public.stages s on s.id = st.stage_id
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "touch_points_insert" on public.touch_points
  for insert with check (
    step_id in (
      select st.id from public.steps st
      join public.stages s on s.id = st.stage_id
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "touch_points_update" on public.touch_points
  for update using (
    step_id in (
      select st.id from public.steps st
      join public.stages s on s.id = st.stage_id
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

create policy "touch_points_delete" on public.touch_points
  for delete using (
    step_id in (
      select st.id from public.steps st
      join public.stages s on s.id = st.stage_id
      join public.journeys j on j.id = s.journey_id
      where j.organization_id = public.user_org_id()
    )
  );

-- =====================
-- Pain Points, Highlights, Evidence (access via touch_point -> ... -> org)
-- Using a helper function for readability
-- =====================

create or replace function public.tp_ids_for_user()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tp.id from public.touch_points tp
  join public.steps st on st.id = tp.step_id
  join public.stages s on s.id = st.stage_id
  join public.journeys j on j.id = s.journey_id
  where j.organization_id = public.user_org_id()
$$;

-- Pain Points
alter table public.pain_points enable row level security;
create policy "pain_points_select" on public.pain_points for select using (touch_point_id in (select public.tp_ids_for_user()));
create policy "pain_points_insert" on public.pain_points for insert with check (touch_point_id in (select public.tp_ids_for_user()));
create policy "pain_points_update" on public.pain_points for update using (touch_point_id in (select public.tp_ids_for_user()));
create policy "pain_points_delete" on public.pain_points for delete using (touch_point_id in (select public.tp_ids_for_user()));

-- Highlights
alter table public.highlights enable row level security;
create policy "highlights_select" on public.highlights for select using (touch_point_id in (select public.tp_ids_for_user()));
create policy "highlights_insert" on public.highlights for insert with check (touch_point_id in (select public.tp_ids_for_user()));
create policy "highlights_update" on public.highlights for update using (touch_point_id in (select public.tp_ids_for_user()));
create policy "highlights_delete" on public.highlights for delete using (touch_point_id in (select public.tp_ids_for_user()));

-- Evidence
alter table public.evidence enable row level security;
create policy "evidence_select" on public.evidence for select using (touch_point_id in (select public.tp_ids_for_user()));
create policy "evidence_insert" on public.evidence for insert with check (touch_point_id in (select public.tp_ids_for_user()));
create policy "evidence_update" on public.evidence for update using (touch_point_id in (select public.tp_ids_for_user()));
create policy "evidence_delete" on public.evidence for delete using (touch_point_id in (select public.tp_ids_for_user()));

-- =====================
-- Archetypes (access via journey org)
-- =====================
alter table public.archetypes enable row level security;

create policy "archetypes_select" on public.archetypes
  for select using (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

create policy "archetypes_insert" on public.archetypes
  for insert with check (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

create policy "archetypes_update" on public.archetypes
  for update using (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

create policy "archetypes_delete" on public.archetypes
  for delete using (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

-- Pillar Ratings
alter table public.pillar_ratings enable row level security;
create policy "pillar_ratings_select" on public.pillar_ratings
  for select using (archetype_id in (select id from public.archetypes where journey_id in (select id from public.journeys where organization_id = public.user_org_id())));
create policy "pillar_ratings_insert" on public.pillar_ratings
  for insert with check (archetype_id in (select id from public.archetypes where journey_id in (select id from public.journeys where organization_id = public.user_org_id())));

-- Radar Charts
alter table public.radar_charts enable row level security;
create policy "radar_charts_select" on public.radar_charts
  for select using (archetype_id in (select id from public.archetypes where journey_id in (select id from public.journeys where organization_id = public.user_org_id())));
create policy "radar_charts_insert" on public.radar_charts
  for insert with check (archetype_id in (select id from public.archetypes where journey_id in (select id from public.journeys where organization_id = public.user_org_id())));

-- Radar Dimensions
alter table public.radar_dimensions enable row level security;
create policy "radar_dimensions_select" on public.radar_dimensions
  for select using (radar_chart_id in (select id from public.radar_charts));
create policy "radar_dimensions_insert" on public.radar_dimensions
  for insert with check (radar_chart_id in (select id from public.radar_charts));

-- =====================
-- Comments (access via journey org)
-- =====================
alter table public.comments enable row level security;

create policy "comments_select" on public.comments
  for select using (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

create policy "comments_insert" on public.comments
  for insert with check (journey_id in (select id from public.journeys where organization_id = public.user_org_id()) and author_id = auth.uid());

create policy "comments_update" on public.comments
  for update using (author_id = auth.uid());

create policy "comments_delete" on public.comments
  for delete using (author_id = auth.uid());

-- =====================
-- Activity Log (access via journey org or own entries)
-- =====================
alter table public.activity_log enable row level security;

create policy "activity_select" on public.activity_log
  for select using (
    journey_id in (select id from public.journeys where organization_id = public.user_org_id())
    or actor_id = auth.uid()
  );

create policy "activity_insert" on public.activity_log
  for insert with check (actor_id = auth.uid());

-- =====================
-- Journey Versions (access via journey org)
-- =====================
alter table public.journey_versions enable row level security;

create policy "versions_select" on public.journey_versions
  for select using (journey_id in (select id from public.journeys where organization_id = public.user_org_id()));

create policy "versions_insert" on public.journey_versions
  for insert with check (journey_id in (select id from public.journeys where organization_id = public.user_org_id()) and created_by = auth.uid());

-- =====================
-- Notifications (user's own only)
-- =====================
alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_insert" on public.notifications
  for insert with check (user_id = auth.uid());

-- =====================
-- Solutions (readable by all authenticated users)
-- =====================
alter table public.solutions enable row level security;

create policy "solutions_select" on public.solutions
  for select using (auth.uid() is not null);

create policy "solutions_insert" on public.solutions
  for insert with check (auth.uid() is not null);

create policy "solutions_update" on public.solutions
  for update using (auth.uid() is not null);
