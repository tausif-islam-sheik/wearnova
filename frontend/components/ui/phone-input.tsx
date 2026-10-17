"use client";

import { useState } from "react";
import { AsYouType } from "libphonenumber-js/min";
import * as Flags from "country-flag-icons/react/3x2";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  PHONE_COUNTRIES,
  countryOfNumber,
  getPhoneCountry,
  nationalPart,
  toE164,
  type CountryCode,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

const flagComponents = Flags as unknown as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;

export function Flag({ code, className }: { code: CountryCode; className?: string }) {
  const Component = flagComponents[code];
  if (!Component) return <span className={cn("inline-block bg-muted", className)} aria-hidden />;
  return <Component aria-hidden className={cn("shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]", className)} />;
}

interface PhoneInputProps {
  /** E.164 number ("+14155552671"), a partial "+<dial>…" draft, or "". */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Used for the flag/dial code when `value` is empty. */
  defaultCountry?: CountryCode;
  id?: string;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}

/**
 * Country-code picker (flag + dial code, searchable) joined to a national-number
 * input that formats as you type. The value it reports is always E.164.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  defaultCountry = "US",
  id,
  name,
  invalid,
  describedBy,
  placeholder,
  autoComplete = "tel-national",
  className,
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(() => countryOfNumber(value) ?? defaultCountry);
  const [text, setText] = useState(() => new AsYouType(country).input(nationalPart(value, country)));
  const [open, setOpen] = useState(false);
  const current = getPhoneCountry(country);

  const handleText = (raw: string) => {
    const formatted = new AsYouType(country).input(raw);
    setText(formatted);
    onChange(toE164(country, formatted));
  };

  const handleCountry = (next: CountryCode) => {
    setCountry(next);
    setOpen(false);
    onChange(toE164(next, text));
  };

  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-0 items-stretch rounded border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20",
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-label={`Country code: ${current.name} +${current.dial}`}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l border-r border-input bg-muted/40 pr-2 pl-2.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
        >
          <Flag code={country} className="h-3.5 w-5" />
          <span className="tabular-nums text-foreground">+{current.dial}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search country or code…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {PHONE_COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} +${c.dial} ${c.code}`}
                    onSelect={() => handleCountry(c.code)}
                    className="gap-2"
                  >
                    <Flag code={c.code} className="h-3.5 w-5" />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">+{c.dial}</span>
                    {c.code === country && <Check className="size-3.5" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}
