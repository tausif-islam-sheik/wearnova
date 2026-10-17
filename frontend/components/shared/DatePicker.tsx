"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  /** Selected day as `YYYY-MM-DD`, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest / latest selectable day, as `YYYY-MM-DD`. Days outside are greyed out and unclickable. */
  min?: string;
  max?: string;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

const START_MONTH = new Date(2020, 0);

/** shadcn date picker: a Popover with a Calendar. Works in plain `YYYY-MM-DD` strings. */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = "Pick a date",
  invalid,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            data-empty={!selected}
            aria-invalid={invalid || undefined}
            className={`h-8 w-40 justify-start gap-2 px-2.5 font-normal data-[empty=true]:text-muted-foreground aria-invalid:border-destructive ${className ?? ""}`}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {selected ? format(selected, "d MMM yyyy") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected}
          startMonth={min ? parseISO(min) : START_MONTH}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 1, 11)}
          disabled={[...(min ? [{ before: parseISO(min) }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
          onSelect={(day) => {
            if (!day) return; // clicking the selected day again must not clear a required date
            onChange(format(day, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
