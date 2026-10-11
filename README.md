# Hostel Complaint Management System (frontend)

React frontend for the Hostel Complaint Management System described in the
project synopsis. It runs entirely on realistic **demo data**, so every page
and workflow can be shown without a backend.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # opens http://localhost:5173
npm run build      # production build in dist/
```

## Demo accounts (password for all: `demo123`)

| Portal       | Email                  | Notes                                   |
|--------------|------------------------|-----------------------------------------|
| Student      | aarav@student.edu      | Block A, nickname QuietOwl              |
| Student      | ishita@student.edu     | Block B, nickname Moonbeam              |
| Warden       | warden.a@hostel.edu    | Also warden.b / warden.c / warden.d     |
| Chief Warden | chief@hostel.edu       |                                         |
| Dean         | dean@hostel.edu        |                                         |

Each login page has one-click demo account buttons. Data changes are saved in
the browser; use **Reset** in the sidebar to restore the original sample data.

## Pages

| Role | Pages |
|------|-------|
| Public | Landing, portal chooser, login and signup for each of the four roles |
| Student | Dashboard, Raise complaint, My complaints, Complaint detail, Fines (pay + receipts), Email inbox, Profile (nickname) |
| Warden | Block dashboard, Block complaints, Complaint detail (status update), Fines (issue + track) |
| Chief Warden | Institution dashboard, All complaints, Complaint detail, Fines, Warden performance, Analytics |
| Dean | Same as Chief Warden, plus every ragging / harassment case |

## Routing and visibility rules (from the synopsis)

All rules are in `src/services/routing.js`, written to mirror the Supabase
Row-Level Security policies you will create.

* **Routine categories** go to the Warden of the student's block and are visible to the Chief Warden and Dean.
* **Complaint against Warden** skips that Warden completely; only the Chief Warden and Dean see it.
* **Ragging / Harassment** goes to the Dean. The student can tick "Keep this complaint hidden from the Chief Warden", in which case only the Dean sees it.
* **Staff never see real names**: complaints and fines show the student's nickname.
* **Status changes, fine issuance and successful payments** each create an email (shown in the student's Email inbox in the demo).

## Going live

See **SETUP.md** for real accounts (Supabase) and real Razorpay test payments.
The app switches to the live backend automatically when `.env` has your Supabase keys.

## What is demo and what is real

| Feature | Now | To go live |
|---|---|---|
| Auth, data, RLS | `demoApi.js` + localStorage | Built: `supabaseApi.js` + `supabase/01-03 *.sql` |
| Emails | In-app inbox | In-app notifications built (database triggers); sending real emails via Resend is next |
| Payments | Simulated checkout | Built: real Checkout + `supabase/functions/create-order` and `verify-payment` |

`src/services/api.js` is the only file the pages call for data, so swapping in
Supabase means replacing those function bodies; the page code stays the same.
Put keys in `.env` (see `.env.example`).

## Things to confirm with your synopsis

* The synopsis names 5 of the 12 categories (Washroom, Electricity, Wi-Fi,
  Complaint against Warden, Ragging/Harassment). The other seven in
  `src/config/constants.js` are placeholders; edit that list.
* "Anonymous even from the Chief Warden" is implemented as hiding the
  complaint from the Chief Warden entirely, since staff already see only a
  nickname.

## Structure

```
src/
  config/        constants (roles, categories, statuses), sidebar nav
  data/          seed.js: sample users, complaints, fines, emails
  services/      api.js (demo backend), routing.js (visibility rules),
                 razorpay.js (demo checkout), format.js, storage.js
  store/         StoreContext (data + auth), ToastContext
  components/
    ui/          Button, Field, Badge, Card, Modal, Tabs, States, BarChart, Icon
    layout/      AppShell (sidebar), RoleGuard, PublicHeader
    *.jsx        ComplaintTable, StatusTrack, AudienceStack, IssueFineModal,
                 RazorpayDemoModal, ReceiptModal, Brand
  pages/
    public/      Landing, Portals, Login, Signup, AuthLayout, NotFound
    student/     StudentDashboard, NewComplaint, MyComplaints, StudentFines, Inbox, Profile
    staff/       StaffDashboard, ComplaintsList, FinesManagement, WardenPerformance, Analytics
    shared/      ComplaintDetail
  styles/        theme.css (palette tokens), app.css (components, responsive)
```

## Colour palette

`#561C24` deep burgundy (primary buttons, sidebar), `#6D2932` wine (hover,
in-progress), `#C7B7A3` taupe (borders, secondary), `#E8D8C4` soft cream
(secondary fills). Lighter backgrounds are tints of the cream; all tokens are
in `src/styles/theme.css`.
