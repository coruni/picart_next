import { cn } from "@/components/editor/types";
import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="h-screen max-w-2xl mx-auto p-6 flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-8xl font-bold text-primary/80 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Sorry The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className={cn(
          "px-6 py-3 rounded-full text-primary border border-primary hover:opacity-90 transition-all duration-300",
          "hover:bg-primary hover:text-white",
        )}
      >
        Back to Home
      </Link>
    </div>
  );
}
