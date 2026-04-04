import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ChefHat,
  Copy,
  Key,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useClaimFirstAdmin, useIsAdmin } from "../../hooks/useQueries";
import AdminsTab from "./AdminsTab";
import CustomersTab from "./CustomersTab";
import MenuTab from "./MenuTab";
import OrdersTab from "./OrdersTab";
import OutletsTab from "./OutletsTab";

type AdminTab = "orders" | "customers" | "outlets" | "menu" | "admins";

interface Props {
  onGoPOS: () => void;
}

function PrincipalIdCard({ principal }: { principal: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(principal).then(() => {
      setCopied(true);
      toast.success("Principal ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 space-y-2 w-full max-w-sm">
      <p className="text-xs font-semibold text-emerald-300">
        Your Principal ID
      </p>
      <p className="text-[11px] text-muted-foreground">
        Share this with an existing admin so they can grant you access.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground break-all select-all">
          {principal}
        </code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="shrink-0 border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/30"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPanel({ onGoPOS }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { login, clear, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const claimFirstAdmin = useClaimFirstAdmin();

  const isLoggedIn = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "orders",
      label: "Orders",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "customers",
      label: "Customers",
      icon: <Users className="w-4 h-4" />,
    },
    { id: "outlets", label: "Outlets", icon: <Store className="w-4 h-4" /> },
    {
      id: "menu",
      label: "Menu Items",
      icon: <UtensilsCrossed className="w-4 h-4" />,
    },
    {
      id: "admins",
      label: "Admins",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="px-5 py-4 border-b border-charcoal-light flex items-center justify-between">
        <img
          src="/assets/uploads/grub_logo_white.jpg-019d2879-724e-76fe-b488-5ce5d0569f40-1.jpeg"
          alt="Grub Shala"
          className="w-28 h-10 object-contain"
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isLoggedIn && isAdmin && (
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-3">
            Management
          </p>
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`admin.${item.id}.tab`}
              onClick={() => {
                setActiveTab(item.id);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-emerald-600/20 text-emerald-300"
                  : "text-white/60 hover:bg-white/10"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="p-3 border-t border-charcoal-light space-y-2 mt-auto">
        <button
          type="button"
          data-ocid="admin.pos.link"
          onClick={() => {
            onClose?.();
            onGoPOS();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 text-xs transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Back to POS
        </button>
        {isLoggedIn && (
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={() => {
              onClose?.();
              clear();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/70 hover:bg-white/10 text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        )}
      </div>
    </>
  );

  // Determine what to show when logged in but not admin
  const renderNotAdminContent = () => {
    // Admin already exists but it's not this user
    if (claimFirstAdmin.data === false) {
      return (
        <div
          data-ocid="admin.error_state"
          className="flex flex-col items-center justify-center h-full gap-4"
        >
          <ShieldAlert className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground text-sm">
            You don&apos;t have admin privileges.
          </p>
          {currentPrincipal && <PrincipalIdCard principal={currentPrincipal} />}
          <Button variant="outline" onClick={clear}>
            Sign out
          </Button>
        </div>
      );
    }

    // Error state
    if (claimFirstAdmin.isError) {
      return (
        <div
          data-ocid="admin.error_state"
          className="flex flex-col items-center justify-center h-full gap-4"
        >
          <ShieldAlert className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold">Error</h2>
          <p className="text-muted-foreground text-sm">
            {claimFirstAdmin.error?.message ??
              "Something went wrong. Please try again."}
          </p>
          {currentPrincipal && <PrincipalIdCard principal={currentPrincipal} />}
          <div className="flex gap-2">
            <Button
              data-ocid="admin.claim.primary_button"
              onClick={() => claimFirstAdmin.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Try Again
            </Button>
            <Button variant="outline" onClick={clear}>
              Sign out
            </Button>
          </div>
        </div>
      );
    }

    // Default: First time setup — no admin claimed yet
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full gap-6 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">First Time Setup</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            No admin has been set up yet. Click below to claim admin access for
            your account.
          </p>
        </div>
        {currentPrincipal && <PrincipalIdCard principal={currentPrincipal} />}
        <Button
          data-ocid="admin.claim.primary_button"
          onClick={() => claimFirstAdmin.mutate()}
          disabled={claimFirstAdmin.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 text-base"
        >
          {claimFirstAdmin.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              Claim Admin Access
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-muted-foreground"
        >
          Sign out
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-charcoal flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed left-0 top-0 bottom-0 w-56 bg-charcoal flex flex-col z-50 md:hidden"
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
          <button
            type="button"
            className="md:hidden p-1 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-[18px] md:text-[22px] font-bold text-foreground">
            Admin Panel
          </h1>
          {isLoggedIn && (
            <span className="hidden md:block text-sm text-muted-foreground">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </span>
          )}
          {/* Spacer for mobile to balance the hamburger */}
          <div className="w-7 md:hidden" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {isInitializing || isAdminLoading ? (
            <div
              data-ocid="admin.loading_state"
              className="flex flex-col gap-4"
            >
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !isLoggedIn ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Sign in with Internet Identity to access the admin panel.
                </p>
              </div>
              <Button
                data-ocid="admin.login.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 text-base"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Admin Login"
                )}
              </Button>
            </motion.div>
          ) : !isAdmin ? (
            renderNotAdminContent()
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "customers" && <CustomersTab />}
              {activeTab === "outlets" && <OutletsTab />}
              {activeTab === "menu" && <MenuTab />}
              {activeTab === "admins" && <AdminsTab />}
            </motion.div>
          )}
        </main>

        {/* Mobile bottom tab bar */}
        {isLoggedIn && isAdmin && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex z-30">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`admin.${item.id}.tab`}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                  activeTab === item.id
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`p-1 rounded-lg ${
                    activeTab === item.id ? "bg-emerald-600/20" : ""
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
