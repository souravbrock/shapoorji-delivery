# Deploying Shapoorji Delivery to DomainAdda (cPanel)

This replaces Supabase with a Node.js + Express API backed by MySQL,
both running on your existing cPanel hosting.

## 1. Create the MySQL database

1. cPanel → **MySQL Databases** → create a database (e.g. `reddevil_shapoorji`)
   and a database user, then add the user to the database with **All Privileges**.
2. cPanel → **phpMyAdmin** → select the new database → **Import** →
   upload `server/schema.sql`. This creates all tables (users, profiles,
   categories, products, favorites, cart_items, orders, order_items, reviews)
   and a handful of starter categories.

## 2. Set up the Node.js app

1. cPanel → **Setup Node.js App** → **Create Application**.
2. Application root: e.g. `shapoorji-api` (upload the `server/` folder here
   via File Manager, FTP, or `git clone` your repo and point to the `server`
   subfolder).
3. Application URL: pick a subdomain or path, e.g. `api.reddevils.co.in`
   or `spdelivery.reddevils.co.in/api`.
4. Application startup file: `index.js`.
5. In the app's **Environment Variables** section, set everything from
   `server/.env.example`:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` — from step 1
   - `JWT_SECRET` — generate with `openssl rand -hex 32`
   - `CORS_ORIGIN` — your frontend's URL, e.g. `https://spdelivery.reddevils.co.in`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`,
     `ADMIN_NOTIFY_EMAIL` — create an email account in cPanel (e.g.
     `orders@reddevils.co.in`) and use its mail server settings
6. Click **Run NPM Install** in the Node.js app screen (installs express,
   mysql2, bcryptjs, jsonwebtoken, cookie-parser, cors, dotenv, nodemailer).
7. Start the app.

## 3. Point the frontend at the API

1. In the React project root, copy `.env.example` to `.env` and set:
   ```
   VITE_API_URL=https://api.reddevils.co.in
   ```
   (whatever URL you chose for the Node app in step 2)
2. Build the frontend: `npm install && npm run build` — this outputs a
   `dist/` folder.
3. Upload the contents of `dist/` to your domain's document root
   (e.g. `public_html` or the folder mapped to `spdelivery.reddevils.co.in`)
   via File Manager, FTP, or Git.
4. Since this is a single-page app, add an `.htaccess` in that folder so
   all routes fall back to `index.html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## 4. Test

- Visit your site, sign up — the first account created becomes admin
  automatically (same behavior as before).
- Add a product as admin, browse the shop, add to cart, check out, and
  confirm the order email arrives.
- Check `/api/health` on your API URL returns `{"ok":true}`.

## Notes

- **Product image uploads**: the admin panel now has an "Upload Image"
  button (in addition to the URL field) that posts to `POST /api/uploads`.
  Files are saved to `server/public/uploads/` and served at
  `https://<your-api-domain>/uploads/<filename>`. Make sure that folder
  is writable by the Node app (it's created automatically on first run).
  If your API and frontend are on different subdomains and image URLs
  come out wrong, set `PUBLIC_API_URL` in the server's environment
  variables to the API's public URL.
- Auth cookies are `httpOnly` and `secure` in production, so both the
  frontend and API must be served over HTTPS for login to persist.
- If frontend and API end up on different subdomains, `CORS_ORIGIN` and
  the cookie's `sameSite` setting matter — `sameSite: 'lax'` works for
  same-site subdomains; cross-site setups may need `sameSite: 'none'`
  plus `secure: true`.
