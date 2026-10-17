"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const cookieCategories = [
  {
    id: "essential",
    label: "Essential",
    description: "Required for the platform to function. Cannot be disabled.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Help us understand how you use the platform so we can improve it.",
    required: false,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Remember your settings and personalize your experience.",
    required: false,
  },
];

export default function CookieSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    essential: true,
    analytics: true,
    preferences: true,
  });

  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    if (id === "essential") return;
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your cookie preferences. Essential cookies are always enabled.
      </p>

      <div className="space-y-4 mb-8">
        {cookieCategories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-start justify-between gap-4 rounded-lg border p-4"
          >
            <div>
              <h3 className="text-sm font-medium text-foreground">{cat.label}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[cat.id]}
                onChange={() => toggle(cat.id)}
                disabled={cat.required}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary" />
            </label>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        className="bg-brand-primary text-white hover:bg-brand-primary-hover"
      >
        {saved ? "Saved!" : "Save preferences"}
      </Button>
    </div>
  );
}
