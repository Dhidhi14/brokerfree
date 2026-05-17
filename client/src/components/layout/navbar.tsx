import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDashboardPath } from '@/lib/role-routes';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setMobileOpen(false);
  };

  const dashboardPath = user ? getDashboardPath(user.role) : '/';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="text-xl font-bold text-primary"
          onClick={() => setMobileOpen(false)}
        >
          BrokerFree
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                {user.role === 'admin' ? (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                ) : null}
                {user.role === 'owner' ? (
                  <DropdownMenuItem onClick={() => navigate('/owner/kyc')}>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Verification
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() => toast.info('Profile settings coming soon')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="brand-gradient text-primary-foreground hover:opacity-90"
              >
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <p className="px-2 text-sm font-medium">{user.fullName}</p>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    navigate(dashboardPath);
                    setMobileOpen(false);
                  }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                {user.role === 'admin' ? (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/admin');
                      setMobileOpen(false);
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                ) : null}
                {user.role === 'owner' ? (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/owner/kyc');
                      setMobileOpen(false);
                    }}
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Verification
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    toast.info('Profile settings coming soon');
                    setMobileOpen(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  className={cn('justify-start text-destructive')}
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button
                  asChild
                  className={cn(
                    'justify-start brand-gradient text-primary-foreground hover:opacity-90'
                  )}
                >
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    Sign up
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
