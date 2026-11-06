# SEO and Google

## What is already built
- Clean links (`/shop`, `/p/black-hoodie`, Arabic under `/ar/...`). Google can't index `#` links, so the old ones redirect to the new ones.
- Each page gets its own title, description, social preview (the ROVEN image), canonical link and Arabic/English `hreflang` pairs. The server sends them in the HTML, so Google, WhatsApp and Facebook see them without running JavaScript.
- Structured data: Organization and WebSite (home), Product with price and stock (product pages), BreadcrumbList, FAQPage.
- `/sitemap.xml` is built from the live catalog (new products appear without a redeploy) and `/robots.txt` points to it.
- Private pages (admin, cart, tracking, review links) are blocked or marked noindex. Wrong links return a real 404.
- Icons and `site.webmanifest` for browsers and phones.

## What you must do
1. **Set the real address.** Vercel > Settings > Environment Variables: `VITE_SITE_URL` = your final address with `https://` and no slash at the end (for example `https://roven.com`). Redeploy. If you later move from the vercel.app address to your own domain, change it and redeploy.
2. **Google Search Console** (search.google.com/search-console): add your site. For the "URL prefix" method pick the HTML tag option, copy only the `content` value into a Vercel variable `VITE_GOOGLE_VERIFICATION`, redeploy, then press Verify. Then open Sitemaps and submit `sitemap.xml`.
   If you verified with the HTML file method instead, the file `public/google6e72f750e98b89d2.html` is already in the project. Keep it there, because Google re-checks it from time to time.
3. Check a link preview with the Facebook Sharing Debugger (developers.facebook.com/tools/debug). WhatsApp keeps old previews for a while, so a changed image can take days to refresh.
4. Test a product page with Google's Rich Results Test (search.google.com/test/rich-results).

## What helps ranking (your side)
- Fill in the product description in both languages, and add real photos. Pages with only a name and a price rank poorly.
- Write the About page and the FAQ in your own words, with the questions customers actually ask.
- Use clear product names that say what the item is ("Black oversized hoodie"), not only a code.
- Indexing takes days to weeks, and nobody can promise a position. Keep the site fast and keep adding real content.
