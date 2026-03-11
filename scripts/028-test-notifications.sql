-- Find the user ID for aslan@renascence.io and insert test notifications
WITH user_profile AS (
  SELECT id FROM public.profiles WHERE email = 'aslan@renascence.io' LIMIT 1
)
INSERT INTO public.notifications (user_id, type, message, link)
SELECT 
  id,
  type::text,
  message,
  link
FROM user_profile
CROSS JOIN (VALUES 
  ('mention', 'John Smith mentioned you in a comment on "Mashreq Bank Retail Journey"', '/journeys/027705bd-321d-4017-9c16-f0c86ff31932/canvas'),
  ('share', 'Sarah Johnson added you as a collaborator on "Customer Onboarding Journey"', '/journeys/027705bd-321d-4017-9c16-f0c86ff31932/canvas'),
  ('share', 'Mike Wilson removed you as a collaborator from "Support Experience Journey"', '/journeys')
) AS t(type, message, link);
