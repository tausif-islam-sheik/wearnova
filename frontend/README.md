This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Payments (Stripe Connect escrow — TEST mode)

- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to a **test** key (`pk_test_...`). The backend uses its own `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (also test mode).
- Checkout uses Stripe's Payment Element. Use Stripe's test card `4242 4242 4242 4242` (any future date, any CVC) — never attempt real charges.
- To test webhooks locally, run the Stripe CLI and forward events to the backend:

  ```bash
  stripe listen --forward-to localhost:4000/api/stripe/webhook
  ```

  Copy the printed `whsec_...` signing secret into the backend's `STRIPE_WEBHOOK_SECRET` env var, then trigger events (e.g. `stripe trigger payment_intent.succeeded`) from another terminal.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
