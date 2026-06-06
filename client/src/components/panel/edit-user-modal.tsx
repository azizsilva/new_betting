"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { updateUser } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";

interface EditUserModalProps {
  user: { id: number; username: string } | null;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, password: "" });
    }
  }, [user]);

  const mut = useMutation({
    mutationFn: (data: { id: number; username?: string; password?: string }) =>
      updateUser(data.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["downline"] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["subtree"] });
      toast.success("User updated successfully");
      onClose();
    },
    onError: (e) =>
      toast.error(
        isAxiosError(e) ? (e.response?.data?.error?.message ?? "Failed") : "Failed to update user",
      ),
  });

  if (!user) return null;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const input =
    "h-11 w-full rounded-lg border border-line bg-bg-elevated px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div>
            <h2 className="text-lg font-bold">Edit User</h2>
            <p className="text-xs text-muted">ID: {user.id}</p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg-elevated hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data: any = { id: user.id };
            if (form.username.trim() && form.username !== user.username) {
              data.username = form.username.trim();
            }
            if (form.password) {
              data.password = form.password;
            }
            if (Object.keys(data).length > 1) {
              mut.mutate(data);
            } else {
              onClose(); // Nothing changed
            }
          }}
          className="flex flex-col gap-4 p-5"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Username</span>
            <input
              className={input}
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              minLength={3}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">New Password (optional)</span>
            <input
              className={input}
              type="text"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={4}
            />
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={mut.isPending || (!form.password && form.username === user.username)}
              className="gap-2"
            >
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Edit3 className="size-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
