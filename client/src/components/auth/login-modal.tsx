"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Crown, Eye, EyeOff, Lock, User, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { landingForRole } from "@/lib/auth-api";

// Shared login form, used inside either the desktop dialog or the mobile sheet.
function LoginForm({ onDone }: { onDone: () => void }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      if (res.data.user && res.data.accessToken && res.data.refreshToken) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        toast.success("Connexion réussie");
        onDone();
        router.push(landingForRole(res.data.user.role));
      } else {
        toast.error("Identifiants invalides");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Échec de la connexion";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-2 flex flex-col items-center gap-2">
        <div className="grid size-12 place-items-center rounded-full bg-surface">
          <Crown className="size-6 text-gold" fill="currentColor" />
        </div>
        <h2 className="text-xl font-bold text-fg">Se connecter</h2>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-3.5 size-4 text-muted" />
            <input
              type="text"
              placeholder="Entrez votre nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex h-11 w-full rounded-md border border-line bg-bg-elevated px-10 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-50"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 size-4 text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-11 w-full rounded-md border border-line bg-bg-elevated px-10 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-50"
              disabled={loading}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-muted hover:text-fg"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="text-xs font-semibold text-gold hover:underline">
            Mot de passe oublié ?
          </button>
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full text-base" disabled={!username || !password || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" /> Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Pas de compte ? Contactez votre agent.
      </p>
    </>
  );
}

export function LoginModal() {
  const { loginModalOpen, closeLoginModal } = useUiStore();

  // Centered popup on every viewport (mobile + desktop) — no bottom sheet.
  return (
    <Dialog.Root open={loginModalOpen} onOpenChange={(o) => !o && closeLoginModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-90 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-90 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-line bg-bg-elevated p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <Dialog.Title className="sr-only">Se connecter</Dialog.Title>
          <Dialog.Description className="sr-only">Connectez-vous à votre compte</Dialog.Description>
          <Dialog.Close className="absolute right-4 top-4 text-muted hover:text-fg">
            <X className="size-5" />
          </Dialog.Close>
          <LoginForm onDone={closeLoginModal} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
