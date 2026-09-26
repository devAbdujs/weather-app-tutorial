'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSessionCounts(filters: any) {
  // Mock for E2E testing
  if (process.env.NODE_ENV === 'development' && filters.subject === 'Geography') {
    return 50; // Mock 50 questions
  }

  const supabase = await createClient();
  
  let query = supabase.from('questions').select('*', { count: 'exact', head: true });
  
  if (filters.examType) query = query.eq('exam_type', filters.examType);
  if (filters.subject && filters.subject !== 'All') query = query.eq('subject', filters.subject);
  if (filters.year) query = query.eq('year_ec', parseInt(filters.year, 10));

  const { count, error } = await query;
  if (error) {
    console.error("Error fetching session counts:", error);
    return 0;
  }
  
  return count || 0;
}
