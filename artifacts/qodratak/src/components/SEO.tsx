import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

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
const DEFAULT_IMAGE = `${DOMAIN}/qodratak-app-icon.png`;
export const PLATFORM_NAME = 'منصة قدراتك';
export const PLATFORM_DESCRIPTION =
  'منصة قدراتك التعليمية للاستعداد لاختبارات القدرات والتحصيلي عبر تدريب منظم، محاكاة، بنك أسئلة وتحليل واضح للتقدم.';
const DEFAULT_TITLE = 'منصة قدراتك | تدريب القدرات والتحصيلي بخطة واضحة';

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
    if (manageCanonical) {
      const canonicalLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
      const canonicalLink = canonicalLinks[0] || document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = fullUrl;
      if (!canonicalLink.parentNode) document.head.appendChild(canonicalLink);
      canonicalLinks.slice(1).forEach((link) => link.remove());
    }

    if (manageRobots) {
      const robotsTags = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'));
      const robotsTag = robotsTags[0] || document.createElement('meta');
      robotsTag.name = 'robots';
      robotsTag.content = noIndex ? 'noindex, nofollow' : 'index, follow';
      if (!robotsTag.parentNode) document.head.appendChild(robotsTag);
      robotsTags.slice(1).forEach((tag) => tag.remove());
    }
  }, [fullUrl, manageCanonical, manageRobots, noIndex]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content={PLATFORM_NAME} />
      {manageRobots && <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />}
      
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
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
      
      {manageCanonical && <link rel="canonical" href={fullUrl} />}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
