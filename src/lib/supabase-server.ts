import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

export async function getUserRole() {
  const supabase = await createClient();
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, email')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function isAdmin() {
  const role = await getUserRole();
  return role?.role === 'admin';
}

export async function isEditor() {
  const role = await getUserRole();
  return role?.role === 'editor';
}
