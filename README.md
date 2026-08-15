# Gyaan Ashram Career Institute — Version 3

Version 3 is a UI-first redesign based on the supplied Gyaan Ashram branding.

## Design direction

- The supplied promotional PNG is NOT used as the website background.
- Navy, gold, cream and white are used as the design language.
- The hero is built with HTML/CSS shapes, gradients, typography and the Gyaan Ashram logo.
- Study Material is the primary homepage action.
- Classes are visible directly on the homepage.
- Mobile and desktop layouts are explicitly handled with responsive CSS media queries.
- The admin workflow from the prototype is retained.

## Demo admin

Username: `admin`
Password: `admin123`

This is prototype authentication only. Before public production use, replace it with Supabase Auth.

## Demo storage

Uploaded PDFs are stored in browser localStorage in this prototype. That means an upload made on one device/browser is not automatically available on another device.

Production architecture:
- Netlify or GitHub Pages for frontend
- Supabase Auth for admin authentication
- Supabase PostgreSQL for classes, subjects and material metadata
- Supabase Storage for PDFs

## Files

- `index.html` — complete Version 3 frontend
- `assets/gyaan-ashram-logo.jpg` — full logo crop derived from the supplied branding image
- `assets/tissues-in-action.pdf` — supplied sample study material

## Local run

Open `index.html` directly, or use:

`python -m http.server 8000`

Then visit:

`http://localhost:8000`
