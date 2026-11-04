# 360 Taxes Booking Site: Peggy Darnell

> Don't wait, don't be late, get your FREE tax prep estimate!

Website for Peggy Darnell, Tax Preparer with 360 Taxes (Memphis, TN). Clients book a free tax preparation estimate through Calendly, see the free Eventbrite workshops, and get the "What to bring" checklist.

**Hosting:** GitHub Pages (free). The site lives in the `docs/` folder. No servers or Azure needed.

## Files

```
docs/
  index.html        The page
  site-config.js    <- EDIT: Calendly link, phone, Eventbrite links, workshop dates
  app.js, styles.css
  assets/           Flyer and photo
```

## Go live on GitHub Pages

1. Upload the `docs` folder to this repo (drag the folder onto **Add file → Upload files**, then **Commit changes**).
2. Repo → **Settings → Pages**.
3. **Source:** Deploy from a branch. **Branch:** `main`, folder **`/docs`**. Click **Save**.
4. Wait 1 to 2 minutes. Your site will be at `https://peggydpy.github.io/360taxes-booking/`.

## Connect Calendly

1. Sign up free at calendly.com and connect your Google calendar.
2. Create an event: **FREE Tax Preparation Estimate**, 30 minutes.
   - **Location:** phone call, Zoom or Google Meet, and/or in person
   - **Availability:** Monday to Thursday 5 to 8 PM, Saturday 10 AM to 4 PM
   - **Date range:** today through January 31, 2027 (extend to April 15 later)
   - **Booking questions:** phone number; individual, business, or both; any 1099 or side income; new or returning; how did you hear about us
3. Copy the event link (**Copy link** on the event card).
4. In GitHub, open `docs/site-config.js`, click the pencil, and paste it:
   ```js
   calendlyUrl: 'https://calendly.com/your-name/free-tax-estimate',
   ```
   Then **Commit changes**. The calendar shows on your site in about a minute.

Until a link is added, the booking section shows "Call or text 901-578-7973" buttons.

## Workshops (edit `docs/site-config.js`)

| Date | Workshop |
| --- | --- |
| Sat Nov 14, 2026, 11 AM | Get Your Refund Ready: Free Tax Prep 101 |
| Sat Dec 5, 2026, 11 AM | Side Hustle & 1099 Tax Bootcamp |
| Thu Dec 10, 2026, 6:30 PM | Small Business Year-End Tax Checklist |
| Sat Jan 9, 2027, 11 AM | Tax Season Kickoff + Free Document Check |
| Sat Jan 23, 2027, 11 AM | W-2s Are Here: Get Ready to File |

Paste each Eventbrite link into that event's `url`. The button changes to **Register free**, and past events hide automatically.
