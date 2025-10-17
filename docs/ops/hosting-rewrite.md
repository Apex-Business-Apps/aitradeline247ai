# Hosting rewrite requirement

To guarantee client-side routing works on every deep link, configure your CDN or hosting layer to rewrite every request to the SPA entry point:

```
/*  ->  /index.html
```

Ensure the rule bypasses asset directories (e.g. `/assets/`, `/build/`, `/static/`) so hashed bundles are served directly while all other paths resolve to `index.html`.
