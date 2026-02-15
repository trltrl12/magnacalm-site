# MagnaCalm — Terra Botanics Website

A fast, responsive, standalone product landing page for MagnaCalm supplements. Built with plain HTML, CSS, and JavaScript. Ready to deploy to Netlify with your own custom domain.

---

## What's Included

```
magnacalm-site/
├── index.html          ← Main product landing page
├── about/index.html    ← About / Our Story page
├── contact/index.html  ← Contact page with multi-step form
├── 404.html            ← Custom 404 error page
├── css/styles.css      ← All styles (responsive for desktop/tablet/mobile)
├── js/main.js          ← All JavaScript (tabs, FAQ, form, animations)
├── images/             ← Put your product images here
├── netlify.toml        ← Netlify configuration (clean URLs, redirects)
└── README.md           ← This file
```

Your URLs will be clean:
- `yourdomain.com` → homepage/product page
- `yourdomain.com/about` → about page
- `yourdomain.com/contact` → contact page with multi-step form

---

## STEP 1: Get Your Files Ready

1. Download the `magnacalm-site` folder to your computer
2. Add your product images to the `images/` folder:
   - `product-main.jpg` — main product photo (recommended: 1040x1240px)
   - `ingredients.jpg` — ingredients section image (recommended: 1000x1250px)
   - Any additional images you want
3. In `index.html`, replace the SVG placeholders with your real images:
   - Find the comment `<!-- Replace this SVG with your real product image -->` and swap the SVG block with:
     ```html
     <img class="gallery-main-image" src="/images/product-main.jpg" alt="MagnaCalm bottle">
     ```
   - Do the same for the ingredients section image

---

## STEP 2: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Verify your email address

---

## STEP 3: Upload Your Site to GitHub

**Option A — Using GitHub.com (no coding required):**

1. Log into GitHub
2. Click the green "New" button (or go to https://github.com/new)
3. Name your repository: `magnacalm-site`
4. Make sure "Public" is selected
5. Click "Create repository"
6. On the next page, click "uploading an existing file"
7. Drag and drop ALL the files and folders from your `magnacalm-site` folder
8. Click "Commit changes"

**Option B — Using GitHub Desktop (easier for future updates):**

1. Download GitHub Desktop: https://desktop.github.com
2. Sign in with your GitHub account
3. Click "File" → "Add Local Repository"
4. Select your `magnacalm-site` folder
5. It will ask to create a new repository — click "Create Repository"
6. Click "Publish repository" in the top bar
7. Uncheck "Keep this code private" and click "Publish"

---

## STEP 4: Deploy to Netlify (Free)

1. Go to https://app.netlify.com
2. Click "Sign up" and choose "Sign up with GitHub"
3. Authorize Netlify to access your GitHub
4. Once logged in, click "Add new site" → "Import an existing project"
5. Select "GitHub" as your Git provider
6. Find and click on your `magnacalm-site` repository
7. Leave all the build settings as default (no build command needed)
8. Click "Deploy site"
9. Wait 30-60 seconds — your site is now live!
10. Netlify gives you a random URL like `random-name-123.netlify.app` — you can view your site there immediately

---

## STEP 5: Connect Your Custom Domain

**Buy your domain (if you haven't already):**
- Recommended: https://www.namecheap.com or https://www.cloudflare.com/products/registrar/
- Search for your desired domain (e.g., `terrabotanics.com`)
- Purchase it ($10-15/year for .com)

**Connect it to Netlify:**

1. In Netlify, go to your site dashboard
2. Click "Domain settings" (or "Set up a custom domain")
3. Click "Add a domain"
4. Type your domain (e.g., `terrabotanics.com`) and click "Verify"
5. Click "Add domain"
6. Netlify will show you DNS records to add. You'll see something like:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   ```
   and
   ```
   Type: CNAME
   Name: www
   Value: your-site-name.netlify.app
   ```
7. Go to your domain registrar (Namecheap, Cloudflare, etc.)
8. Find "DNS" or "Manage DNS" settings
9. Add the records Netlify showed you
10. Save and wait 10 minutes to 24 hours for DNS to propagate
11. Back in Netlify, click "Verify DNS configuration"
12. Once verified, click "Provision SSL certificate" for free HTTPS

Your site is now live at `https://yourdomain.com`!

---

## STEP 6: Set Up Stripe Payments

1. Create a Stripe account: https://dashboard.stripe.com/register
2. Once logged in, go to "Products" and click "Add product"
3. Fill in:
   - Name: `MagnaCalm — 30 Day Supply`
   - Price: `$39.00` (one-time) and/or `$29.25` (recurring/subscription)
   - Click "Save product"
4. Go to "Developers" → "API keys"
5. Copy your **Publishable key** (starts with `pk_live_` or `pk_test_` for testing)
6. In your `index.html`, add this before the closing `</head>` tag:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```
7. In `js/main.js`, find the `handleCheckout()` function and uncomment the Stripe code
8. Replace `pk_live_YOUR_PUBLISHABLE_KEY` with your actual key
9. Replace `price_YOUR_PRICE_ID` with the price ID from your Stripe product
   - Find this in Stripe → Products → click your product → copy the price ID (starts with `price_`)
10. Push your changes to GitHub — Netlify will automatically redeploy

**Testing:** Use `pk_test_` key first. Stripe provides test card number `4242 4242 4242 4242` with any future date and any CVC.

---

## STEP 7: Set Up Tracking

**Google Analytics 4:**

1. Go to https://analytics.google.com
2. Click "Start measuring" and create an account
3. Set up a Web data stream with your domain
4. Copy your Measurement ID (looks like `G-XXXXXXXXXX`)
5. In `index.html`, find the tracking comment near the top and replace it with:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```
6. Add this same snippet to `about/index.html` and `contact/index.html` too

**Meta (Facebook) Pixel:**

1. Go to https://business.facebook.com → Events Manager
2. Click "Connect Data Sources" → "Web" → "Meta Pixel"
3. Name it and click "Create Pixel"
4. Choose "Install code manually"
5. Copy the pixel code and paste it in the `<head>` of all your HTML pages
6. To track purchases, add this to the `handleCheckout()` function in `main.js`:
   ```javascript
   fbq('track', 'InitiateCheckout', {value: 29.25, currency: 'USD'});
   ```

**Google Tag Manager (recommended for managing all pixels):**

1. Go to https://tagmanager.google.com
2. Create an account and container for your website
3. Copy the two code snippets GTM gives you
4. Paste them in all your HTML pages (one in `<head>`, one after opening `<body>`)
5. Now you can manage GA4, Meta Pixel, TikTok Pixel, and any other tracking from GTM's dashboard without editing code

---

## STEP 8: Contact Form Setup

The contact form is already configured to work with Netlify Forms. When you deploy to Netlify:

1. Forms are automatically detected (the `data-netlify="true"` attribute handles this)
2. Go to your Netlify dashboard → "Forms" tab to see submissions
3. To get email notifications: Netlify → Site settings → Forms → Form notifications → Add "Email notification"
4. Enter your email address and save
5. You'll now get an email every time someone submits the contact form
6. Free tier includes 100 form submissions per month

---

## How to Update Your Site

**If you used GitHub Desktop:**
1. Edit files on your computer
2. Open GitHub Desktop — it will show your changes
3. Write a summary (e.g., "Updated pricing") and click "Commit to main"
4. Click "Push origin"
5. Netlify automatically redeploys in about 30 seconds

**If you uploaded via GitHub.com:**
1. Go to your repository on GitHub
2. Navigate to the file you want to edit
3. Click the pencil icon to edit
4. Make your changes
5. Click "Commit changes"
6. Netlify automatically redeploys

---

## How to Add New Pages

1. Create a new folder with the page name (e.g., `privacy/`)
2. Inside that folder, create an `index.html` file
3. Copy the structure from `about/index.html` as a starting template
4. Update the content
5. Push to GitHub
6. Your new page will be live at `yourdomain.com/privacy`

---

## Customizing Colors

All colors are defined as CSS variables at the top of `css/styles.css`. Change them there and they update everywhere:

```css
--color-bg: #FAF7F2;           /* Main background */
--color-bg-warm: #F3EDE4;      /* Section backgrounds */
--color-text: #2C2416;          /* Headings */
--color-text-muted: #7A6E5E;   /* Body text */
--color-accent-green: #5C6B4A; /* Buttons, badges, accents */
--color-badge: #C4A97D;        /* Stars, gold accents */
--color-border: #D9CEBD;       /* Borders, dividers */
```

---

## Responsive Breakpoints

The site is already responsive with these breakpoints:
- **Desktop:** 1025px and above (full two-column layout)
- **Tablet:** 768px–1024px (single column, adjusted spacing)
- **Mobile:** Below 768px (compact layout, hidden nav, touch-friendly)

Test on all devices using Chrome DevTools: right-click → Inspect → click the device icon in the top-left of the inspector.

---

## Cost Summary

| Item | Cost |
|------|------|
| Domain name | ~$12/year |
| Hosting (Netlify free tier) | $0/month |
| SSL certificate | $0 (included) |
| Stripe payments | 2.9% + $0.30 per transaction |
| Contact form (100 submissions/month) | $0 (included) |
| Google Analytics | $0 |
| **Total monthly cost** | **~$1/month** (just the domain) |

Compare to Shopify at $39/month + 2.9% transaction fees.

---

## Need Help?

- Netlify docs: https://docs.netlify.com
- Stripe docs: https://stripe.com/docs
- Google Analytics: https://support.google.com/analytics
- DNS help: https://docs.netlify.com/domains-https/custom-domains/
