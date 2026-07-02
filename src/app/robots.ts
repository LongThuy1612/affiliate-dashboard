import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'Facebot',
        allow: '/',
      },
      {
        userAgent: ['Twitterbot', 'LinkedInBot', 'WhatsApp', 'TelegramBot'],
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}
