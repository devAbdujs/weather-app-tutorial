'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';

const ADMIN_COOKIE_NAME = 'temari_admin_token';

export async function loginAdmin(secret: string) {
  const correctSecret = process.env.ADMIN_SECRET;
  
  if (!correctSecret) {
    throw new Error('ADMIN_SECRET is not configured on the server.');
  }

  if (secret === correctSecret) {
    // In a real app, use a JWT. For this MVP, we just set a secure cookie 
    // that we verify the existence of. 
    cookies().set({
      name: ADMIN_COOKIE_NAME,
      value: secret, // store the secret itself in the httpOnly cookie to verify later
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 60 * 60 * 24 // 1 day
    });
    return { success: true };
  }
  
  return { success: false, error: 'Invalid secret' };
}

export async function verifyAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const correctSecret = process.env.ADMIN_SECRET;
  
  // If no secret is configured locally, we allow dev access, otherwise require match
  if (!correctSecret && process.env.NODE_ENV !== 'production') return true;
  
  return token === correctSecret;
}

export async function getAdminStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  
  const [usersReq, notesReq, questionsReq] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('study_notes').select('*', { count: 'exact', head: true }),
    supabase.from('exam_questions').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: usersReq.count || 0,
    totalNotes: notesReq.count || 0,
    totalQuestions: questionsReq.count || 0,
  };
}
