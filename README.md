# PrintMyNotes

Private, local-first PDF tools for students.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The app can also be installed from Chrome as a PWA on Android when served over HTTPS or from a local development environment.

## Free public beta

1. Push this repository to a public GitHub repository.
2. Create a Cloudflare Pages project from that repository.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy and use the generated `pages.dev` URL while validating the product.
5. Add a custom domain only after the tool flows and content are stable.

The repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`. After pushing to a repository, enable Pages with **GitHub Actions** as the source. GitHub Pages supports custom apex domains and subdomains; add the domain in Settings → Pages, verify it, then create the DNS records GitHub provides. Enable HTTPS after the certificate is issued.

GitHub Pages is suitable for a free beta and static traffic. GitHub documents a soft 100 GB/month bandwidth limit, so move the static output to a CDN such as Cloudflare Pages if the site grows beyond the beta or begins serving very large assets.

See [docs/PLAN.md](docs/PLAN.md) for the SEO, mobile, analytics, ads, hosting, and product roadmap.
