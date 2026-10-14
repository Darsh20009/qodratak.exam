import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { updateRouteHead } from '@/lib/routeHead';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  manageCanonical?: boolean;
  manageRobots?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const DOMAIN = 'https://qodratak.sa';
const DEFAULT_IMAGE = `${DOMAIN}/qodratak-icon-light.png`;
export const PLATFORM_NAME = 'قدراتك | منصة القدرات والتحصيلي';
export const PLATFORM_DESCRIPTION =
  'قدراتك (Qodratak) منصة تعليمية سعودية للتأسيس اللفظي والكمي، بنك أسئلة، اختبارات محاكية وخطة تدريب للقدرات والتحصيلي.';
const DEFAULT_TITLE = 'قدراتك | منصة القدرات والتحصيلي في السعودية';

export function SEO({
  title = DEFAULT_TITLE,
  description = PLATFORM_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = DOMAIN,
  type = 'website',
  noIndex = false,
  manageCanonical = false,
  manageRobots = false,
  structuredData,
}: SEOProps) {
  const fullUrl = url.startsWith('http') ? url : `${DOMAIN}${url}`;
  const fullImage = image.startsWith('http') ? image : `${DOMAIN}${image}`;

  useEffect(() => {
    updateRouteHead(document.head, {
      canonical: manageCanonical ? fullUrl : undefined,
      robots: manageRobots ? (noIndex ? 'noindex, nofollow' : 'index, follow') : undefined,
    });
  }, [fullUrl, manageCanonical, manageRobots, noIndex]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content={PLATFORM_NAME} />
      
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="256" />
      <meta property="og:image:height" content="256" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content="شعار منصة قدراتك" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={PLATFORM_NAME} />
      <meta property="og:locale" content="ar_SA" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content="شعار منصة قدراتك" />
      
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
