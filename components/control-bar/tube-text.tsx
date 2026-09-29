import { cn } from "@/lib/utils";

interface TubeTextProps {
  children: React.ReactNode;
  className?: string;
}

export function TubeText({ children, className }: TubeTextProps) {
  return <span className={cn("font-mono", className)}>{children}</span>;
}
