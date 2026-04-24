import { cn } from "@/lib/utils";

interface RightPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function RightPanel({ children, className }: RightPanelProps) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-4 lg:shrink-0 lg:w-[300px] xl:w-[320px]",
        className,
      )}
    >
      {children}
    </aside>
  );
}
