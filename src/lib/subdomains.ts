export type SubdomainType = 'entrance' | 'freshman' | 'exit' | 'root';

export interface SubdomainConfig {
  type: SubdomainType;
  label: string;
  shortLabel: string;
  emoji: string;
  tagline: string;
  headline: string;
  highlightedText: string;
  description: string;
  badge: string;
  questionCount: string;
  subjects: string[];
  targetExam: string | null;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

export const SUBDOMAIN_CONFIGS: Record<SubdomainType, SubdomainConfig> = {
  entrance: {
    type: 'entrance',
    label: 'Grade 12 Entrance Exam (EUEE)',
    shortLabel: 'Grade 12 EUEE',
    emoji: '🎓',
    tagline: 'Ethiopian University Entrance Exam Portal',
    headline: 'Master the Grade 12 National Exam.',
    highlightedText: 'Score your dream university.',
    description: '15,000+ real EUEE past papers (2010–2018 E.C.) with chapter notes and instant AI explanations for Natural & Social Science.',
    badge: 'Grade 12 Matric & EUEE',
    questionCount: '15,000+',
    subjects: ['Mathematics', 'Biology', 'Physics', 'Chemistry', 'English', 'Aptitude (SAT)', 'Economics', 'Geography', 'History', 'Civics'],
    targetExam: 'entrance',
    metaTitle: 'Grade 12 EUEE Exam Prep & AI Study Partner | Temari',
    metaDescription: 'Master the Ethiopian University Entrance Exam (EUEE Grade 12) with 15,000+ real past exam questions, chapter notes, and Temari AI Tutor.',
    metaKeywords: ['Grade 12 Entrance Exam', 'EUEE past papers', 'Ethiopian matric exam', 'Natural science entrance', 'Social science entrance', 'Temari Grade 12'],
  },
  freshman: {
    type: 'freshman',
    label: 'University Freshman & Remedial',
    shortLabel: 'Univ. Freshman',
    emoji: '🏛️',
    tagline: 'Ethiopian University First-Year Portal',
    headline: 'Ace Your University Freshman Courses.',
    highlightedText: 'Top your campus GPA.',
    description: 'Midterm and final past papers for Logic, Applied Math, Psychology, and Emerging Tech. Secure your department placement.',
    badge: 'University Freshman',
    questionCount: '8,000+',
    subjects: ['Applied Math I', 'Logic & Critical Thinking', 'General Psychology', 'Physics for Freshman', 'Emerging Technology', 'Global Trends', 'Economics'],
    targetExam: 'freshman',
    metaTitle: 'University Freshman Courses & Remedial Exam Prep | Temari',
    metaDescription: 'Ace Ethiopian university freshman courses (Logic, Applied Math, Psychology, Physics, Emerging Tech) with notes and past papers.',
    metaKeywords: ['Freshman courses Ethiopia', 'Ethiopian university freshman exams', 'Remedial exam past papers', 'Temari freshman', 'Logic exam past papers'],
  },
  exit: {
    type: 'exit',
    label: 'University Exit Exam',
    shortLabel: 'Exit Exam',
    emoji: '🏆',
    tagline: 'Ministry of Education Exit Exam Portal',
    headline: 'Pass Your University Exit Exam.',
    highlightedText: 'Graduate with pride.',
    description: 'Timed drills and official MoE exam questions across Engineering, Medicine, Law, and Business to clear the 50% cutoff.',
    badge: 'University Exit Exam',
    questionCount: '8,000+',
    subjects: ['Computer Science', 'Software Engineering', 'Civil Engineering', 'Electrical Engineering', 'Accounting & Finance', 'Law', 'Medicine', 'Nursing'],
    targetExam: 'exit',
    metaTitle: 'Ethiopian University Exit Exam Prep | Temari',
    metaDescription: 'Prepare for MoE Ethiopian University Exit Exams across Engineering, Medicine, Business, Law, and Health departments.',
    metaKeywords: ['Ethiopian exit exam', 'University exit exam past papers', 'MoE exit exam questions', 'Engineering exit exam Ethiopia', 'Law exit exam Ethiopia'],
  },
  root: {
    type: 'root',
    label: 'All Ethiopian Exams',
    shortLabel: 'All Exams',
    emoji: '🇪🇹',
    tagline: 'All-in-One Exam Prep for Ethiopian Scholars',
    headline: 'Master your national exams.',
    highlightedText: 'Without the stress.',
    description: '31,000+ real exam questions across Grade 12, Freshman, and Exit exams with step-by-step AI explanations.',
    badge: '31,000+ National Exam Papers',
    questionCount: '31,000+',
    subjects: ['Grade 12 EUEE', 'University Freshman', 'University Exit Exams', 'Remedial Program'],
    targetExam: null,
    metaTitle: 'Temari | AI Exam Prep & Study Partner for Ethiopian Students',
    metaDescription: 'The ultimate exam prep app for Ethiopian students. Practice EUEE (Grade 12), University Freshman, and Exit Exams with AI-powered notes and real past papers.',
    metaKeywords: ['Ethiopia', 'EUEE', 'Grade 12 Entrance Exam', 'Ethiopian University Exit Exam', 'Freshman courses', 'Temari App', 'Ethiopian exam prep'],
  },
};

/**
 * Extracts the subdomain from incoming Host header.
 * Examples:
 *   - "entrance.temari.top" -> "entrance"
 *   - "freshman.temari.app" -> "freshman"
 *   - "exit.localhost:3000" -> "exit"
 *   - "temari.top" -> "root"
 *   - "localhost:3000" -> "root"
 */
export function parseSubdomain(hostHeader: string | null | undefined): SubdomainType {
  if (!hostHeader) return 'root';
  const cleanHost = hostHeader.toLowerCase().split(':')[0].trim();

  if (cleanHost.startsWith('entrance.') || cleanHost.startsWith('euee.')) {
    return 'entrance';
  }
  if (cleanHost.startsWith('freshman.') || cleanHost.startsWith('firstyear.')) {
    return 'freshman';
  }
  if (cleanHost.startsWith('exit.') || cleanHost.startsWith('exitexam.')) {
    return 'exit';
  }

  return 'root';
}

/**
 * Resolves the absolute URL for a given subdomain portal.
 */
export function getSubdomainUrl(type: SubdomainType, path = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';

  try {
    const parsed = new URL(siteUrl);
    const host = parsed.hostname;

    // Local development mode
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      if (type === 'root') return `${parsed.protocol}//${parsed.host}${cleanPath}`;
      // In local dev, prepend subdomain or pass query param fallback
      return `${parsed.protocol}//${type}.${parsed.host}${cleanPath}`;
    }

    // Production domain (e.g. temari.top or temari.app)
    const baseParts = host.split('.');
    const rootDomain = baseParts.length >= 2 ? baseParts.slice(-2).join('.') : host;

    if (type === 'root') {
      return `https://${rootDomain}${cleanPath}`;
    }
    return `https://${type}.${rootDomain}${cleanPath}`;
  } catch {
    return cleanPath || '/';
  }
}

/**
 * Resolves the URL for the exam portal.
 * In production, returns the full dedicated subdomain (e.g. https://entrance.temari.top).
 * In local dev, falls back to path routes (e.g. /entrance) for seamless offline testing.
 */
export function getExamPortalPath(type: SubdomainType, path = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';

  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    if (type === 'root') return cleanPath || '/';
    return `/${type}${cleanPath}`;
  }

  return getSubdomainUrl(type, path);
}

