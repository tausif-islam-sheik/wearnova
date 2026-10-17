import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Wearnova uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help us
            remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How We Use Cookies</h2>
          <p>
            We use essential cookies for site functionality, analytics cookies to understand how you
            use our platform, and preference cookies to remember your settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Managing Cookies</h2>
          <p>
            You can control cookie settings through your browser preferences. Disabling certain cookies
            may affect the functionality of our platform.
          </p>
        </section>
      </div>
    </div>
  );
}
