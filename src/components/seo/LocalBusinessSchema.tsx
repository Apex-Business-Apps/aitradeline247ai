import React from 'react';
import { Helmet } from 'react-helmet-async';

export const LocalBusinessSchema: React.FC = () => {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "TradeLine 24/7",
    "description": "24/7 AI receptionist and customer service automation for businesses",
    "url": "https://www.tradeline247ai.com",
    "telephone": "+1-587-742-8885",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CA"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Canada"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "$$",
    "image": "https://www.tradeline247ai.com/assets/app-icon.png"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
    </Helmet>
  );
};
