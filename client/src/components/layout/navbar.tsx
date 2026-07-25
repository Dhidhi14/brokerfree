import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Shield,
  ShieldCheck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConversationsQuery } from '@/hooks/use-chat';
import { sumUnreadConversations } from '@/lib/chat-utils';
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
  const { data: conversations = [] } = useConversationsQuery(Boolean(isAuthenticated && user));
  const unreadTotal = sumUnreadConversations(conversations, user?.role);

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
          <Button variant="ghost" asChild>
            <Link to="/properties">Browse Properties</Link>
          </Button>
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" asChild className="relative">
                <Link to="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                  {unreadTotal > 0 ? (
                    <Badge className="ml-2 h-5 min-w-5 justify-center bg-indigo-600 px-1.5 hover:bg-indigo-600">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </Badge>
                  ) : null}
                </Link>
              </Button>
              {user.role === 'tenant' || user.role === 'owner' ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/agreements">
                      <FileText className="mr-2 h-4 w-4" />
                      Agreements
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/escrow">
                      <Wallet className="mr-2 h-4 w-4" />
                      Deposits
                    </Link>
                  </Button>
                </>
              ) : null}
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
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/property-verifications')}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Property Verifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/escrow')}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Escrow Management
                    </DropdownMenuItem>
                  </>
                ) : null}
                {user.role === 'tenant' ? (
                  <DropdownMenuItem onClick={() => navigate('/tenant/applications')}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    My Applications
                  </DropdownMenuItem>
                ) : null}
                {user.role === 'owner' ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/owner/kyc')}>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Verification
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/owner/properties')}>
                      <Building2 className="mr-2 h-4 w-4" />
                      My Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/owner/applications')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Applications
                    </DropdownMenuItem>
                  </>
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
            </>
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
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/properties" onClick={() => setMobileOpen(false)}>
                Browse Properties
              </Link>
            </Button>
            {isAuthenticated && user ? (
              <>
                <p className="px-2 text-sm font-medium">{user.fullName}</p>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    navigate('/chat');
                    setMobileOpen(false);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                  {unreadTotal > 0 ? (
                    <Badge className="ml-2 h-5 min-w-5 justify-center bg-indigo-600 px-1.5 hover:bg-indigo-600">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </Badge>
                  ) : null}
                </Button>
                {user.role === 'tenant' || user.role === 'owner' ? (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/agreements');
                        setMobileOpen(false);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Agreements
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/escrow');
                        setMobileOpen(false);
                      }}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Deposits
                    </Button>
                  </>
                ) : null}
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
                  <>
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
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/admin/property-verifications');
                        setMobileOpen(false);
                      }}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Property Verifications
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/admin/escrow');
                        setMobileOpen(false);
                      }}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Escrow Management
                    </Button>
                  </>
                ) : null}
                {user.role === 'tenant' ? (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/tenant/applications');
                      setMobileOpen(false);
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    My Applications
                  </Button>
                ) : null}
                {user.role === 'owner' ? (
                  <>
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
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/owner/properties');
                        setMobileOpen(false);
                      }}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      My Properties
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        navigate('/owner/applications');
                        setMobileOpen(false);
                      }}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Applications
                    </Button>
                  </>
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
