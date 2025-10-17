# Deployment TODOs

- [ ] Run `npm install` locally with registry credentials that can access `@capacitor/*` packages. The automated attempt from CI blocked with HTTP 403 (forbidden) when requesting `https://registry.npmjs.org/@capacitor%2fandroid`.
- [ ] After installing, commit the regenerated `package-lock.json` if it differs from the current tree.
- [ ] Execute `npm run verify:react` and `npm run build` locally to confirm the bundle before deployment.
