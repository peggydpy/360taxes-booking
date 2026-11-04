# 360 Taxes Booking Site: Peggy Darnell

> Don't wait, don't be late, get your FREE tax prep estimate!

Booking website for Peggy Darnell, Tax Preparer with 360 Taxes (Memphis, TN). Clients pick a day and time for a free tax preparation estimate, see the free Eventbrite workshops, and get the "What to bring" checklist. Peggy manages appointments on a private admin page.

**Stack:** Azure Static Web Apps (free tier) + Azure Functions (Node 20) + Azure Table Storage, deployed by GitHub Actions on every push to `main`.

## What's inside

```
src/                    Website (static files)
  index.html            Home + booking form + workshops + checklist
  site-config.js        <- EDIT: phone, Eventbrite links, workshop dates
  app.js, styles.css
  admin/                Private appointments page (admins only)
  assets/               Flyer and photo
  staticwebapp.config.json   Locks /admin and /api/manage to the "admin" role
api/                    Azure Functions backend
  src/shared/config.js  <- EDIT: booking hours, booking end date, days off
  src/shared/handlers.js
  src/functions/index.js
.github/workflows/      Auto-deploy to Azure
```

**API routes:** `GET /api/window`, `GET /api/slots?date=YYYY-MM-DD`, `POST /api/book`, `GET /api/manage/bookings` (admin), `PATCH /api/manage/bookings/{date}/{time}` (admin).

## Booking rules (edit `api/src/shared/config.js`)

- **Open:** today through **January 31, 2027** (`bookingEndDate`). Move it to `2027-04-15` when tax season starts.
- **Hours:** Monday to Thursday 5:00 to 8:00 PM, Saturday 10:00 AM to 4:00 PM, 30-minute slots, 2 hours minimum notice.
- **Days off:** Thanksgiving, Christmas Eve and Day, New Year's Eve and Day (`blackoutDates`).
- A time slot can only be booked once. Cancelling a booking in the admin page reopens the slot.
- The form blocks Social Security / tax ID numbers. Documents go through the 360 Taxes secure portal only.

## Workshops (edit `src/site-config.js`)

| Date | Workshop |
| --- | --- |
| Sat Nov 14, 2026, 11 AM | Get Your Refund Ready: Free Tax Prep 101 |
| Sat Dec 5, 2026, 11 AM | Side Hustle & 1099 Tax Bootcamp |
| Thu Dec 10, 2026, 6:30 PM | Small Business Year-End Tax Checklist |
| Sat Jan 9, 2027, 11 AM | Tax Season Kickoff + Free Document Check |
| Sat Jan 23, 2027, 11 AM | W-2s Are Here: Get Ready to File |

After you publish each event on Eventbrite, paste its link into that event's `url` field. The button changes from "Registration opening soon" to **Register free**. Past events hide automatically.

## Deploy (about 15 minutes)

1. **Create the GitHub repo.** On github.com, make a new repo named `360taxes-booking` (private is fine). Then in this folder:
   ```bash
   git remote add origin https://github.com/<your-username>/360taxes-booking.git
   git push -u origin main
   ```
2. **Create storage.** Azure Portal → Storage account (Standard, LRS, cheapest) → **Access keys** → copy the **Connection string**.
3. **Create the Static Web App.** Azure Portal → Static Web Apps → Create → Plan **Free** → Deployment source **Other**. When it's created, click **Manage deployment token** and copy it.
4. **Add the token to GitHub.** Repo → Settings → Secrets and variables → Actions → New secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`, paste the token.
5. **Add app settings.** Static Web App → Settings → **Environment variables**:
   - `STORAGE_CONNECTION_STRING` = the connection string from step 2
   - `BOOKINGS_TABLE` = `Bookings`
6. **Deploy.** Push any change (or re-run the workflow in the Actions tab). Your site goes live at the `*.azurestaticapps.net` URL.
7. **Make yourself admin.** Static Web App → **Role management** → Invite → Provider **GitHub**, your GitHub username, role `admin`. Open the invite link and accept. Then visit `/admin/`.
8. **Custom domain (optional).** Static Web App → Custom domains, for example `book.yourdomain.com`.

> If you created the Static Web App with GitHub as the source instead, Azure adds its own workflow file. Keep one of them: delete the other, and make sure the secret name matches.

## Run locally

```bash
npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4 azurite
azurite --silent &                       # local storage emulator
cp api/local.settings.sample.json api/local.settings.json
cd api && npm install && cd ..
swa start src --api-location api         # http://localhost:4280
```
The SWA CLI lets you fake an admin login at `/.auth/login/github`. Add the role `admin`.

## Ideas for later

- Text or email confirmations (Azure Communication Services or Twilio)
- Add-to-calendar file on the confirmation screen
- A Google review link after appointments are marked Completed
