import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { authenticated, user } = useAuth();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent cursor-pointer">
              College Advisor
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">Home</span>
          </Link>
          {authenticated ? (
            <>
              <Link href="/profile">
                <span className="text-sm font-medium hover:text-primary cursor-pointer">
                  {user?.username}'s Profile
                </span>
              </Link>
              <Link href="/profile">
                <span className="inline-block">
                  <Button variant="outline" size="sm">My Account</Button>
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm font-medium hover:text-primary cursor-pointer">Login</span>
              </Link>
              <Link href="/register">
                <span className="inline-block">
                  <Button size="sm">Sign Up</Button>
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}