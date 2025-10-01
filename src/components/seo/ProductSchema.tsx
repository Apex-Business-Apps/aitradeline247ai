import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ProductSchemaProps {
  name: string;
  description: string;
  price?: string;
  currency?: string;
  availability?: string;
}

export const ProductSchema: React.FC<ProductSchemaProps> = ({
  name,
  description,
  price,
  currency = "USD",
  availability = "InStock"
}) => {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "TradeLine 24/7"
    },
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": currency,
        "availability": `https://schema.org/${availability}`,
        "url": "https://www.tradeline247ai.com/pricing"
      }
    }),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};
