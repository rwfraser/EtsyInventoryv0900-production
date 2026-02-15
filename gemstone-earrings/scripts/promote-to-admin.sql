-- Promote rogeridaho@gmail.com to admin
-- Run this in Drizzle Studio or Vercel Postgres dashboard

UPDATE users 
SET role = 'admin', 
    email_verified = COALESCE(email_verified, NOW())
WHERE email = 'rogeridaho@gmail.com';

-- Verify the update
SELECT id, email, name, role, email_verified 
FROM users 
WHERE email = 'rogeridaho@gmail.com';
