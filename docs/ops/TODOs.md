# Deployment TODOs

- [ ] Run `npm install` locally with registry credentials that can access `@capacitor/*` packages. The automated attempt from CI blocked with HTTP 403 (forbidden) when requesting `https://registry.npmjs.org/@capacitor%2fandroid`.
- [ ] After installing, commit the regenerated `package-lock.json` if it differs from the current tree.
- [ ] Execute `npm run verify:react` and `npm run build` locally to confirm the bundle before deployment.
- [ ] Push branch `fix/react-singleton-2025-10-17` to origin manually; automated push failed inside CI workspace because no `origin` remote is configured.
- [ ] Reinstall the Lovable GitHub App at the org level: uninstall, reinstall with All repositories access, then reauthorize under personal OAuth as per Prompt 1.
- [ ] Toggle Lovable installation between selected repositories and all repositories to refresh tokens per Prompt 2.
- [ ] Collect webhook delivery statuses and Actions run summaries for the last three events, then document follow-up per Prompt 12.

