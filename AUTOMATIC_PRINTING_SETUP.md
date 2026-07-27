# Adams Elite Automatic Bill Printing

This update adds a private Supabase print queue and a small Windows printer agent.
After Razorpay payment is verified and the order is saved, a normal purchase bill
or rental bill is queued automatically.

The Windows agent sends ESC/POS data directly to the **CITIZEN CT-D150**. It does
not open Chrome's print dialog and it cuts after the final bill line, avoiding the
large fixed-page blank area.

## 1. Create the print queue

Open **Supabase Dashboard → SQL Editor**, paste the contents of:

```text
supabase/automatic-printing.sql
```

and click **Run** once.

## 2. Create one private printer key

Run this in PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Save the generated value. Add it to your local `.env.local`:

```env
PRINTER_API_KEY=PASTE_THE_GENERATED_VALUE
```

When you deploy to Vercel, add the same variable and value in **Vercel → Project
Settings → Environment Variables**.

Never commit the real key to GitHub.

## 3. Test locally before deployment

Keep the Next.js website running:

```powershell
npm run dev
```

Inside `printer-agent`, copy `.env.example`, rename the copy to `.env`, and use:

```env
WEBSITE_URL=http://localhost:3000
PRINTER_API_KEY=THE_SAME_VALUE_FROM_ENV_LOCAL
PRINTER_NAME=CITIZEN CT-D150
POLL_INTERVAL_MS=5000
```

Double-click:

```text
printer-agent/test-printer.bat
```

A test bill should print and cut. Then double-click:

```text
printer-agent/start-printer-agent.bat
```

Keep that window open and place one Razorpay test order. The bill should print
automatically after the server verifies and saves the payment.

## 4. Use it after Vercel deployment

Change `WEBSITE_URL` in `printer-agent/.env` to the real online URL, for example:

```env
WEBSITE_URL=https://adams-elite.vercel.app
```

Then right-click `printer-agent/install-startup.bat` and choose **Run as
administrator**. The agent will start whenever the shop Windows user signs in.

## Behaviour

- New verified paid orders and rental bookings are queued automatically.
- If the shop PC is off, jobs stay pending and print after the agent starts.
- A failed print is marked failed instead of printing repeatedly.
- Admin Orders and Admin Rentals include **Send to Auto Printer** for reprinting.
- The existing manual **Print Bill** pages remain available.
