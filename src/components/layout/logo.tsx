import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark";
  className?: string;
  href?: string;
}

const SIZE: Record<NonNullable<LogoProps["size"]>, { w: number; h: number }> = {
  sm: { w: 112, h: 34 },
  md: { w: 140, h: 42 },
  lg: { w: 180, h: 54 },
};

export function Logo({
  size = "md",
  variant = "full",
  className,
  href = "/tableau-de-bord",
}: LogoProps) {
  const dims = SIZE[size];
  const src = variant === "full" ? "/logo.svg" : "/logo-mark.svg";
  const markDim = variant === "mark" ? dims.h : undefined;

  const img = (
    <Image
      src={src}
      alt="Keyni"
      width={variant === "full" ? dims.w : (markDim ?? 40)}
      height={variant === "full" ? dims.h : (markDim ?? 40)}
      className={cn("h-auto w-auto select-none", className)}
      priority
    />
  );

  if (!href) return img;
  return (
    <Link href={href} aria-label="Keyni — espace client">
      {img}
    </Link>
  );
}
