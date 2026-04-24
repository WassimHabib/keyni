import { cn } from "@/lib/utils";

interface PageWithAsideProps {
  main: React.ReactNode;
  aside: React.ReactNode;
  className?: string;
}

/**
 * Layout de page à 2 colonnes :
 * - main pleine largeur sur mobile / tablette
 * - main + aside 300-320px à partir de lg
 * L'aside est toujours au-dessus/dessous du main en mobile (pas de collapse).
 */
export function PageWithAside({ main, aside, className }: PageWithAsideProps) {
  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]",
        className,
      )}
    >
      <div className="min-w-0 space-y-6">{main}</div>
      <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        {aside}
      </aside>
    </div>
  );
}
