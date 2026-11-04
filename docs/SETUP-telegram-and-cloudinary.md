# Setup: Telegram order alerts and Cloudinary product photos

Never commit tokens or keys, and never paste them in chats. They live only in Supabase secrets.

## Telegram
1. In Telegram, talk to @BotFather, send /newbot, and copy the bot token.
2. Open your new bot and send it any message. Then open `https://api.telegram.org/bot<TOKEN>/getUpdates` in your browser and copy `chat.id` from the result. (For a group, add the bot to the group and send a message there first.)
3. Deploy and set secrets (Supabase CLI):
   ```
   supabase functions deploy notify-order
   supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... WEBHOOK_SECRET=<a long random string>
   ```
4. Supabase dashboard > Database > Webhooks > Create: table `orders`, events Insert and Update, type Supabase Edge Function `notify-order`, and add an HTTP header `x-webhook-secret` with the same random string.
5. Place a test order. You should get a message, and another one when a receipt is uploaded.

## Cloudinary
1. Create a free Cloudinary account and copy the cloud name, API key and API secret from the dashboard.
2. Deploy and set secrets:
   ```
   supabase functions deploy cloudinary-sign
   supabase secrets set CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
   ```
3. In the dashboard, Products > Photos now uploads to Cloudinary (folder `roven/products`). Only signed-in admins can get an upload signature.
4. Payment receipts stay in the private Supabase bucket on purpose: Cloudinary links are public by default and receipts should not be.
