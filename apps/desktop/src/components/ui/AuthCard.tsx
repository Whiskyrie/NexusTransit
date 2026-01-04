import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function AuthCard({ children, className, id }: AuthCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-10 w-full max-w-105 mx-4 animate-fadeInUp",
        className,
      )}
    >
      {children}
    </div>
  );
}
