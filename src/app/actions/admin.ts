'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';

const ADMIN_COOKIE_NAME = 'temari_admin_session';

export async function loginAdmin(username: string, passcode: string) {
  const supabase = await createAdminClient();
  
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, username, role, passcode')
    .eq('username', username)
    .single();

  if (error || !admin || admin.passcode !== passcode) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Simple encoded session for MVP. We verify against DB on every action for security.
  const sessionData = JSON.stringify({ id: admin.id, username: admin.username, role: admin.role });
  const encoded = Buffer.from(sessionData).toString('base64');

  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: encoded,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return { success: true };
}

export async function verifyAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const session = JSON.parse(decoded);
    
    // Always verify against DB to ensure role changes apply instantly and deleted users lose access
    const supabase = await createAdminClient();
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, username, role')
      .eq('id', session.id)
      .single();
    
    return admin || null;
  } catch {
    return null;
  }
}

export async function logoutAdmin() {
  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/admin'
  });
  return { success: true };
}

export async function getAdmins() {
  const admin = await verifyAdmin();
  if (admin?.role !== 'superadmin') throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createAdminAccount(username: string, passcode: string, role: string) {
  const admin = await verifyAdmin();
  if (admin?.role !== 'superadmin') throw new Error('Unauthorized: Only Superadmins can create accounts.');

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_users')
    .insert({ username, passcode, role });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Username already exists.' };
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getAdminStats() {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

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

export async function getUsers() {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getQuestions(limit = 100) {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('exam_questions')
    .select('id, exam_type, subject, year, question_text, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
