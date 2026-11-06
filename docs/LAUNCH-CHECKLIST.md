# Before the client starts adding products

## Accounts
- [ ] Create the client's admin user in Supabase (Authentication > Users), add the id to `admins`, and turn off "Allow new users to sign up".
- [ ] Strong, unique passwords for Supabase, Vercel, Cloudinary, GitHub and the Telegram bot. Turn on two-step verification where offered.
- [ ] Decide who owns each account (Vercel, GitHub, Supabase, Cloudinary, domain). Vercel's Hobby plan is for non-commercial use, so a shop needs a plan that allows commercial use.
- [ ] Fill the two TODO lines in `PRIVACY.md` (retention and contact).

## Test it end to end with a fake product
- [ ] `/admin` login works on a computer and on a phone.
- [ ] Add a product with photos (this tests the Cloudinary function). It appears on the site and in `/sitemap.xml`.
- [ ] Place a cash order and a transfer order (upload a receipt). Both appear in Orders, and the Telegram message arrives.
- [ ] Move an order to shipped, send the review link on WhatsApp, leave a review, approve it, see it on the home page.
- [ ] Cancel an order: the stock comes back. Try a discount code.
- [ ] Delete the test product and orders.

## Security check (takes two minutes)
In PowerShell, with your project URL and anon key (the anon key is public by design):
```
curl.exe "https://YOUR-REF.supabase.co/rest/v1/orders?select=*" -H "apikey: YOUR_ANON_KEY" -H "Authorization: Bearer YOUR_ANON_KEY"
```
It must return `[]`. Repeat with `admins` and with `testimonials?status=eq.pending`. Any real data coming back means a policy is wrong: stop and tell me.

## Visit statistics
Run `supabase/09_visits.sql`, deploy, then open the site in a private window and browse a few pages. In the dashboard open "الزيارات" and the visits should appear. Your own browser is not counted once you have signed in to the dashboard from it. Nothing needs to be enabled on Vercel.
