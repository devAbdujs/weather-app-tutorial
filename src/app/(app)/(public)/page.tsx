import type { Metadata } from 'next';
import { headers, cookies } from 'next/headers';
import { getServerSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/marketing/LandingPage';
import { parseSubdomain, SUBDOMAIN_CONFIGS, getSubdomainUrl, SubdomainType } from '@/lib/subdomains';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const headerSubdomain = headersList.get('x-temari-subdomain');
  const subdomain = (headerSubdomain && ['entrance', 'freshman', 'exit'].includes(headerSubdomain))
    ? (headerSubdomain as SubdomainType)
    : parseSubdomain(host);
  const config = SUBDOMAIN_CONFIGS[subdomain];
  const url = getSubdomainUrl(subdomain);

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: config.metaKeywords,
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url,
      siteName: 'Temari App',
      images: [
        {
          url: '/assets/New_temari_logo.png',
          width: 371,
          height: 219,
          alt: `Temari - ${config.label}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.metaTitle,
      description: config.metaDescription,
      images: ['/assets/New_temari_logo.png'],
    },
  };
}

export default async function HomePage({ searchParams }: { searchParams?: { logged_out?: string } }) {
  const headersList = await headers();
  const host = headersList.get('host');
  const headerSubdomain = headersList.get('x-temari-subdomain');
  const subdomain = (headerSubdomain && ['entrance', 'freshman', 'exit'].includes(headerSubdomain))
    ? (headerSubdomain as SubdomainType)
    : parseSubdomain(host);

  const isLoggedOutParam = searchParams?.logged_out === '1';
  const cookieStore = cookies();
  const isLoggedOutCookie = cookieStore.get('temari_manual_logout')?.value === 'true';

  let session = null;
  if (!isLoggedOutParam && !isLoggedOutCookie) {
    session = await getServerSession();
  }
  
  if (session) {
    if (subdomain !== 'root') {
      redirect(`/dashboard?target_exam=${subdomain}`);
    }
    redirect('/dashboard');
  }

  const config = SUBDOMAIN_CONFIGS[subdomain];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: `Temari - ${config.label}`,
    url: getSubdomainUrl(subdomain),
    logo: 'https://temari.top/assets/New_temari_logo.png',
    image: 'https://temari.top/assets/New_temari_logo.png',
    description: config.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ETB',
    },
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage initialPortal={subdomain} />
    </>
  );
}
