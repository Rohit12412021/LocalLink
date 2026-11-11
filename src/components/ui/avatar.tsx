"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClass = {
    sm: "avatar-sm",
    md: "avatar-md",
    lg: "avatar-lg",
    xl: "avatar-xl",
  }[size];

  if (src) {
    return (
      <span className={cn("avatar", sizeClass, className)}>
        <Image
          src={src}
          alt={name}
          width={128}
          height={128}
          className="h-full w-full object-cover object-center"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span className={cn("avatar", sizeClass, className)} aria-label={name}>
      {initialsOf(name)}
    </span>
  );
}