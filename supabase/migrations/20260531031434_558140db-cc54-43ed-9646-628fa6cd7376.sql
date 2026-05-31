-- Grant admin role to owner
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'maxmacbookings@gmail.com'
ON CONFLICT DO NOTHING;

-- Add contact_email to settings for public-facing enquiries address
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT 'tippytopsproperty@gmail.com';

UPDATE public.settings SET contact_email = 'tippytopsproperty@gmail.com' WHERE id = 1;