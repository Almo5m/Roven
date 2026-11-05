# ROVEN

The website for my streetwear brand, ROVEN. Built for real ones.

Black, silver, sharp edges, and a light you move across the metal logo. React + Vite on the front, Supabase behind it.

## What works now
Home with the drop countdown, product pages (size and color), cart, checkout with cash on delivery, Arabic and English with RTL. Online payment saves the order as "awaiting payment" until I connect a gateway.

## Run it
```
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```
Without the .env it runs on three demo products, so you can look around first.

## Supabase
Run `supabase/schema.sql` in the SQL editor. Customers can't write to the orders table directly: they go through `create_order`, which calculates the total on the server. Add yourself to the `admins` table to get dashboard access later.

## Dashboard
Open `/#/admin`. Sign in with a Supabase Auth user that is listed in the `admins` table (the steps are in `supabase/02_admin.sql`, run it after `schema.sql`). You get an overview, orders with status changes, and products with photo upload. All of it is protected by Row Level Security, not just by the screen.

## Extras (run `supabase/03_extras.sql` after the other two)
Drop date, shipping fee and free-shipping threshold are editable in the dashboard (Settings). Stock per size (sold-out sizes get disabled, cancelling an order puts the stock back), discount codes, and order tracking with the order code plus the phone number at `/#/track`.

## Manual transfer payment (run `supabase/04_transfer.sql`)
Until I have a commercial register and tax card for a real gateway, customers can pay by transfer (InstaPay, wallet or bank). They see my transfer details (edited in Dashboard > Settings), get an order code, then upload the receipt at `/#/track`. I check the receipt in the Orders tab and move the order to confirmed. Receipts are in a private bucket that only admins can read.

## Telegram alerts and Cloudinary photos
New orders and uploaded receipts message me on Telegram (free, unlike WhatsApp Business). Product photos go to Cloudinary through a signed upload. Both run in Supabase Edge Functions, so no secret is in the browser. Steps: `docs/SETUP-telegram-and-cloudinary.md`.

## Site structure (run `supabase/05_content.sql`)
Home (hero, ticker, featured pieces, brand line, drop countdown), Shop with category filters, product pages with gallery, description and shipping/payment info, plus tracking and the cart. Descriptions, categories, the featured flag and social links are edited in the dashboard. The brand line on the home page is placeholder copy in `src/lib/i18n.js`: rewrite it in my own words.

## UI update (run `supabase/06_ui.sql`)
Top announcement bar, sticky header with a mobile menu, collections, featured pieces, lookbook, trust row, customer reviews, About, Size guide and FAQ pages, and a proper footer. The texts, FAQ, size chart, lookbook photos and reviews are all edited in the dashboard, and sections with no content stay hidden. The release countdown is optional: it only shows while a release date is set in Settings.

## Identity and catalog (run `supabase/07_catalog.sql`)
Identity line: YOUR DIFFERENCE. YOUR POWER. The logo is the transparent version (`public/logo-r.png`). The header is glass with cut corners like the logo, and the language switch is a small EN | ع toggle. Categories and collections are created, edited, ordered and hidden from the dashboard (Categories and Collections tabs), and each product picks its category and collections. I removed the scrolling ticker.

## Dashboard (Arabic only)
The dashboard is Arabic and right-to-left, organised in a side menu (sales, catalog, site). Adding and editing happens in pop-up windows (on phones they slide up as sheets), and it works on phones, tablets and desktops.

## Phones and deploy
The layout is tuned for phones: compact header, two-column product grid, swipeable product photos (no hover on touch), and the logo light moves on its own and follows the scroll. Deploy steps and the two Vercel environment variables are in `docs/DEPLOY-vercel.md`. `vercel.json` adds security headers.

## Next
Online payment gateway once registered, order notifications (email or WhatsApp), security review, launch.

Moaz Amin / AL-MO
