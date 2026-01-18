'use client';

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        caption: "flex items-center justify-between",
        caption_label: "text-sm font-semibold",
        nav: "flex items-center gap-1",
        nav_button: "h-8 w-8 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-secondary",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-9 text-[10px] font-semibold uppercase text-muted-foreground",
        row: "mt-2 flex w-full",
        cell: "relative h-9 w-9 text-center text-sm",
        day: "h-9 w-9 rounded-lg p-0 font-medium hover:bg-secondary",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
        day_today: "border border-primary/40",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-40",
        day_range_middle: "bg-secondary",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className={cn("h-4 w-4", iconClassName)} {...iconProps} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
