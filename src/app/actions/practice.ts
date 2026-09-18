'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSessionCounts(filters: any) {
  const supabase = await createClient();
  
  let query = supabase.from('questions').select('*', { count: 'exact', head: true });
  
  if (filters.examType) query = query.eq('exam_type', filters.examType);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.year) query = query.eq('year_ec', filters.year);
  if (filters.university) query = query.eq('university', filters.university);
  if (filters.period) query = query.eq('exam_period', filters.period);
  if (filters.department) query = query.eq('department', filters.department);
  if (filters.variant) query = query.eq('exam_variant', filters.variant);

  const { count, error } = await query;
  if (error) {
    console.error("Error fetching session counts:", error);
    return 0;
  }
  
  return count || 0;
}
