ADAMS ELITE AUTOMATIC PRINTER AGENT
===================================

WHAT IT DOES
------------
After a normal online purchase or rental advance payment is verified and saved,
the website adds one bill to a private Supabase print queue. This Windows agent
checks the queue, prints directly to CITIZEN CT-D150 using ESC/POS RAW mode, cuts
the receipt after the last line, and marks the job as printed.

Because it sends ESC/POS receipt data directly, it does not use Chrome's fixed
279 mm / 130 mm page size and does not print the large blank page area.

REQUIREMENTS
------------
1. This folder must stay on the shop Windows PC connected to CITIZEN CT-D150.
2. Node.js 20 or newer must be installed.
3. The Citizen printer must be installed in Windows with the exact printer name.
4. The website must be deployed online, for example on Vercel.

FIRST-TIME SETUP
----------------
1. In Supabase Dashboard -> SQL Editor, run:
      supabase/automatic-printing.sql

2. Create a long random secret. In PowerShell you can run:
      -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})

3. Add this to local .env.local AND Vercel Environment Variables:
      PRINTER_API_KEY=YOUR_RANDOM_SECRET

4. Redeploy Vercel after adding the environment variable and updated code.

5. In this printer-agent folder, copy:
      .env.example
   and rename the copy to:
      .env

6. Edit printer-agent/.env:
      WEBSITE_URL=https://your-real-vercel-or-domain-url
      PRINTER_API_KEY=the-same-secret-used-in-vercel
      PRINTER_NAME=CITIZEN CT-D150
      POLL_INTERVAL_MS=5000

7. Double-click test-printer.bat.
   It should print one test bill and cut immediately after the bill.

8. Double-click start-printer-agent.bat and keep the window open while testing
   one Razorpay test payment.

9. After the test works, right-click install-startup.bat and choose
   "Run as administrator". The agent will then start whenever Windows logs in.

IMPORTANT
---------
- The shop PC, printer and internet must be on for immediate printing.
- If they are off, paid bills remain in the queue. The agent prints them when it
  runs again.
- Failed jobs are not printed repeatedly. Use the "Send to Auto Printer" button
  in Admin Orders/Rentals after fixing the printer.
- The website's manual browser Print Bill button remains available.
- Never publish printer-agent/.env or PRINTER_API_KEY on GitHub.
