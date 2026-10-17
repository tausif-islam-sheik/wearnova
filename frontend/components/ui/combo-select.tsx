"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ComboSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Let the user keep what they typed when it isn't in the list. */
  allowCustom?: boolean;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  className?: string;
}

/** Searchable dropdown (shadcn Popover + Command combobox pattern). */
export function ComboSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search…",
  loading,
  disabled,
  allowCustom,
  onBlur,
  id,
  invalid,
  className,
}: ComboSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const typed = search.trim();
  const showCustom =
    allowCustom && typed.length > 0 && !options.some((o) => o.toLowerCase() === typed.toLowerCase());

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-invalid={invalid}
        disabled={disabled || loading}
        onBlur={onBlur}
        className={cn(
          "flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className
        )}
      >
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {loading ? "Loading…" : value || placeholder}
        </span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-56 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {showCustom && (
                <CommandItem value={`__custom__ ${typed}`} onSelect={() => choose(typed)}>
                  Use “{typed}”
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => choose(option)} className="gap-2">
                  <span className="flex-1 truncate">{option}</span>
                  {option === value && <Check className="size-3.5" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
