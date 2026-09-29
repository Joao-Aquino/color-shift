import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CSButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-12 rounded-full border border-[var(--color-chrome-border)] bg-transparent px-4 text-sm text-[var(--color-text-value)] hover:bg-[var(--color-chrome-raised)]",
        className,
      )}
      variant="outline"
      {...props}
    />
  );
}
