-- NILE — reduce direct access to the public schema.
--
-- The marketplace accesses application tables through the trusted server-side
-- Prisma connection. Browser clients must not query these tables directly via
-- PostgREST. Public product images are served from the public "produits"
-- Storage bucket; KYC files remain in a separate private bucket.
--
-- Applied to production Supabase as migration 20261025130407.
-- IMPORTANT: this default-privilege rule covers objects created by postgres.
-- Objects created by supabase_admin need a separate owner-level change because
-- the migration role cannot alter that role's default privileges.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
