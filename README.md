# Gyaan Ashram Career Institute — Version 2

A responsive study-material portal prototype with the navy/gold branded homepage layout for Gyaan Ashram Career Institute.

## What works in Version 2

- Public homepage using the supplied Gyaan Ashram branding.
- Responsive mobile + desktop layout.
- Class → Subject → Chapter/Topic → PDF browsing.
- Upload date shown automatically.
- Multiple PDFs can be attached to a topic.
- PDF view + download buttons.
- Admin dashboard.
- Demo admin login.
- Add/delete classes.
- Add/delete subjects.
- Upload/edit/delete study material.
- Local browser persistence using `localStorage`.

## Demo admin

Username: `admin`  
Password: `admin123`

**Important:** this login is deliberately only a prototype. It is NOT secure enough for a real public deployment because the credential is present in the client-side JavaScript.

## Production architecture

The next step should replace the demo storage/authentication with:

- Netlify or GitHub Pages for frontend hosting
- Supabase Auth for admin authentication
- Supabase PostgreSQL for classes, subjects and notes metadata
- Supabase Storage for PDF files
- Row Level Security policies so only the authenticated admin can modify content

The public PDFs can remain publicly readable because the project requirements explicitly allow sharing of PDF URLs.

## Running locally

Because the site is static, you can open `index.html` directly in a browser. A local HTTP server is recommended for the most predictable PDF behavior.

Example with Python:

    python -m http.server 8000

Then open:

    http://localhost:8000

## Project structure

    index.html
    styles.css
    app.js
    assets/
      gyaan-ashram-banner.jpg
      gyaan-ashram-logo.jpg
      tissues-in-action.pdf
    README.md


## Version 2 UI changes

- Redesigned homepage to match the structured reference layout: navy navigation, prominent branded hero, centered readable hero panel, feature strip, study-material cards, information strip, about, schedule and contact sections.
- Reworked the header logo treatment so the full Gyaan Ashram name is visible instead of being clipped.
- Existing admin/demo functionality and student material browsing are retained.
