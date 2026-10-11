# Going live: real accounts + Razorpay

The app runs on demo data until you add Supabase keys to `.env`.
Follow these steps in order. Supabase's dashboard labels change occasionally;
if a menu name differs slightly, look for the closest match.

## 1. Create the Supabase project
1. Sign up at https://supabase.com and click **New project**. Pick a region near you (e.g. Mumbai).
2. Save the database password somewhere safe.

## 2. Create the database
1. Open `supabase/01_auth_profiles.sql` and change `HOSTEL-STAFF-2026` to your own staff access code.
2. In Supabase: **SQL Editor > New query**. Paste `supabase/01_auth_profiles.sql`, click **Run**.
3. New query again for `supabase/02_complaints.sql`, Run. Then `supabase/03_fines.sql`, Run.
   They must run in this order (01, 02, 03); each should say "Success".

## 3. Turn off email confirmation (while developing)
**Authentication > Sign In / Providers > Email**: switch off **Confirm email**.
Supabase's built-in confirmation emails are heavily rate-limited on the free plan.
(If you leave it on, the app shows "Check your email" after signup; that also works.)

## 4. Connect the frontend
1. **Project Settings > API**: copy the **Project URL** and the **anon / publishable** key.
2. In the `hcms` folder, copy `.env.example` to `.env` and paste both values.
3. Restart `npm run dev`. The demo-account buttons disappear: you are now live.
4. Sign up one account per role. Staff signups need the access code from step 2.

## 5. Razorpay test keys
1. Sign up at https://dashboard.razorpay.com and make sure **Test Mode** is on.
2. **Account & Settings > API Keys > Generate Key**. Copy the **Key ID** and **Key Secret**
   (the secret is shown only once).

## 6. Edge Functions
In Supabase: **Edge Functions > Secrets**, add:
- `RAZORPAY_KEY_ID` = your Key ID
- `RAZORPAY_KEY_SECRET` = your Key Secret

Then **Edge Functions > Deploy a new function > Via editor**, twice:
- name `create-order`, paste `supabase/functions/create-order/index.ts`, Deploy
- name `verify-payment`, paste `supabase/functions/verify-payment/index.ts`, Deploy

(CLI alternative: `npx supabase login`, `npx supabase link`, `npx supabase functions deploy create-order` and `verify-payment`.)

## 7. Test a payment
1. Log in as a Warden, issue a fine to a student of that block.
2. Log in as that student, open **Fines > Pay now**. Razorpay's window opens.
3. Pay with a test method from https://razorpay.com/docs/payments/payments/test-card-details/
   (UPI test ID `success@razorpay` works for a successful payment).
4. The fine moves to **Paid**, a receipt appears, and the inbox shows "Payment received".
   The payment also appears in the Razorpay dashboard under **Transactions > Payments**.

## 8. Deploying (Vercel / Netlify)
Add the same two `VITE_SUPABASE_*` variables in the hosting dashboard's environment
settings, then redeploy. Add your site URL in Supabase under
**Authentication > URL Configuration > Site URL**.

## Troubleshooting
- **"Sign-up was rejected"**: wrong block, nickname already taken, or wrong staff code.
- **"Razorpay keys are not set on the server"**: secrets missing in step 6; redeploy functions after adding them.
- **Payment opens but never completes**: check **Edge Functions > verify-payment > Logs**.
- **Login works but the page is empty**: the SQL did not run fully. Re-run it in a fresh project.
