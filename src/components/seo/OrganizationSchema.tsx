import React from 'react';
import { Helmet } from 'react-helmet-async';

export const OrganizationSchema: React.FC = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TradeLine 24/7",
    "alternateName": "TL247",
    "description": "Fast and reliable 24/7 customer service and receptionist solutions for businesses",
    "url": "https://www.tradeline247ai.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.tradeline247ai.com/assets/app-icon.png",
      "width": 512,
      "height": 512
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "telephone": "+1-587-742-8885",
      "availableLanguage": ["English"],
      "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    },
    "sameAs": [],
    "foundingDate": "2024",
    "keywords": "AI receptionist, customer service automation, business phone answering, lead capture, CRM integration",
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "serviceType": "AI Customer Service Solutions"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};