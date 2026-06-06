"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import { createUser, creatableRoles, ROLE_LABEL } from "@/lib/panel-api";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function CreateUserPage() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const roles = creatableRoles(me?.role ?? null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: (roles[0] ?? "player") as UserRole,
    rate: 100,
  });

  const mut = useMutation({
    mutationFn: createUser,
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ["downline"] });
      qc.invalidateQueries({ queryKey: ["subtree"] });
      toast.success(`Created ${u.username} (ID ${u.id})`);
      setForm((f) => ({ ...f, username: "", password: "" }));
    },
    onError: (e) =>
      toast.error(
        isAxiosError(e) ? (e.response?.data?.error?.message ?? "Failed") : "Failed to create user",
      ),
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const input =
    "h-11 w-full rounded-lg border border-line bg-bg-elevated px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

  if (roles.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
        Your role cannot create users.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-4">
        <h1 className="text-lg font-bold">Create User</h1>
        <p className="mt-1 text-xs text-muted">
          New accounts are created directly below you in the hierarchy.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({
            username: form.username.trim(),
            password: form.password,
            role: form.role,
            rate: Number(form.rate),
          });
        }}
        className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2"
      >
        <Field label="Username">
          <input className={input} value={form.username} onChange={(e) => set("username", e.target.value)} required minLength={3} />
        </Field>
        <Field label="Password">
          <input className={input} type="text" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={4} />
        </Field>
        <Field label="Role">
          <select className={input} value={form.role} onChange={(e) => set("role", e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Commission rate (%)">
          <input className={input} type="number" min={0} max={100} value={form.rate} onChange={(e) => set("rate", Number(e.target.value))} />
        </Field>

        <div className="sm:col-span-2">
          <Button type="submit" variant="brand" size="lg" disabled={mut.isPending} className="gap-2">
            {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
