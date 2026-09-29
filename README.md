# PrintMyNotes

Private, local-first PDF tools for students.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The app can also be installed from Chrome as a PWA on Android when served over HTTPS or from a local development environment.

## Production deployment on Cloudflare Pages

The production host is Cloudflare Pages. GitHub remains the source repository and CI runner; user files are processed locally in the browser and are not uploaded by the app.

The repository includes `.github/workflows/deploy-cloudflare.yml`. Add these GitHub Actions secrets before enabling production deploys:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with Account → Cloudflare Pages → Edit permission

For a manual deployment, run `npm run deploy:cloudflare` after authenticating Wrangler. The expected Cloudflare Pages project name is `printmynotes`, with `dist` as the output directory.

## Custom domain

`printmynotes.in` is the intended canonical domain in the SEO files. Confirm availability and purchase it at your registrar, then add it in Cloudflare Pages → project → Custom domains. For an apex domain, the domain must be a Cloudflare zone and its nameservers must point to Cloudflare. Cloudflare will then create the Pages DNS record and issue HTTPS automatically.

After the first custom-domain deployment, verify `/`, every `/tools/*` URL, `/privacy`, `/terms`, `/contact`, `/robots.txt`, and `/sitemap.xml`. If you choose a different domain, update the canonical URL, Open Graph URL, `robots.txt`, and `sitemap.xml` before deploying.

See [docs/PLAN.md](docs/PLAN.md) for the SEO, mobile, analytics, ads, hosting, and product roadmap.
