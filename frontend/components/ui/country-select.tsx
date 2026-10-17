"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Flag } from "@/components/ui/phone-input";
import { PHONE_COUNTRIES, countryByName } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  /** Country name, e.g. "United States". */
  value: string;
  onChange: (name: string) => void;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}

/** Searchable list of every country (flag + name). */
export function CountrySelect({ value, onChange, onBlur, id, invalid, className }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = countryByName(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-invalid={invalid}
        onBlur={onBlur}
        className={cn(
          "flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className
        )}
      >
        {selected ? (
          <>
            <Flag code={selected.code} className="h-3.5 w-5" />
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">Select a country</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-64 p-0">
        <Command>
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {PHONE_COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    onChange(c.name);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Flag code={c.code} className="h-3.5 w-5" />
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.name === value && <Check className="size-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
