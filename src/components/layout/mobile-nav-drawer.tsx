"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { SidebarNavContent } from "@/components/layout/admin-sidebar";
import { Button } from "@/components/ui/button";

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-[264px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-[var(--shadow-md)] outline-none transition-transform duration-200 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full lg:hidden">
          <DialogPrimitive.Title className="sr-only">
            Admin navigation menu
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close navigation menu"
                className="absolute top-3 right-3 z-10 cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          <SidebarNavContent onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
