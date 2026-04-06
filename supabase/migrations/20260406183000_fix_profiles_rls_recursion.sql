-- Drop policies that are causing infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Allow all authenticated users to read profiles, removing self-referencing subqueries in SELECT
CREATE POLICY "Enable read access for all authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::public.user_role
  );
