"use client";

import { useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemePreference } from "@/providers/theme-provider";

const emptySubscribe = () => () => {};

const THEME_OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const ActiveIcon = isHydrated && resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Change color theme"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ActiveIcon className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel className="font-medium">Appearance</DropdownMenuLabel>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = isHydrated && theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Icon
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                {option.label}
              </span>
              {isSelected ? (
                <Check className="size-3.5 text-brand" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
