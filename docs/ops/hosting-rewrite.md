# Hosting Rewrite Rule

To ensure deep links never result in a blank screen, configure your hosting/CDN platform to rewrite all application routes to the SPA entry point.

```
/*  /index.html  200
```

This rule guarantees that every request is served the latest build output so the router can render the correct fallback and error boundaries.
