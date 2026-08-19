import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DOMAIN = 'https://www.qodratak.site';
const DEFAULT_IMAGE = `${DOMAIN}/qodratak-logo.png`;
const DEFAULT_TITLE = 'منصة قدراتك - رحلتك نحو التغيير والإبداع';
const DEFAULT_DESCRIPTION = 'منصة قدراتك التعليمية - اختبارات تفاعلية لتطوير مهاراتك في اختبارات القدرات والتحصيلي مع أكثر من 3700 سؤال عالي الجودة وشروحات مفصلة';

export function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = DOMAIN,
  type = 'website'
}: SEOProps) {
  const fullUrl = url.startsWith('http') ? url : `${DOMAIN}${url}`;
  const fullImage = image.startsWith('http') ? image : `${DOMAIN}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content="شعار منصة قدراتك" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="منصة قدراتك" />
      <meta property="og:locale" content="ar_SA" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
}
