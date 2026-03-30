import { Link } from "@/i18n/routing";
export default function RootNotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-8xl font-bold text-primary/80 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Sorry The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  );
}
