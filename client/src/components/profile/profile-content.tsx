"use client";

import type { User } from "@/lib/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-bg-elevated p-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ProfileContent({ user, active }: { user: User; active: string }) {
  if (active === "personal") {
    return (
      <Panel title="Personal Information">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Username" value={user.username} />
          <Field label="Player ID" value={String(user.id)} />
          <Field label="Email" value={user.email ?? ""} />
          <Field label="Mobile" value={user.mobile} />
          <Field label="Currency" value="TND" />
          <Field label="Status" value={user.status} />
        </div>
      </Panel>
    );
  }

  if (active === "notifications") {
    return (
      <Panel title="Notifications">
        <p className="text-sm text-muted">You have no new notifications.</p>
      </Panel>
    );
  }

  if (active === "cashback") {
    return (
      <Panel title="Cashback">
        <p className="text-sm text-muted">Cashback rewards will be shown here.</p>
      </Panel>
    );
  }

  if (active === "benefits") {
    return (
      <Panel title="Benefits">
        <p className="text-sm text-muted">Loyalty benefits and perks will appear here.</p>
      </Panel>
    );
  }

  // Default welcome panel
  return (
    <div className="grid min-h-[420px] place-items-center rounded-2xl border border-line bg-surface p-8 text-center">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo_2_afroo-removebg-preview.png"
          alt="AfroBet216"
          className="mx-auto h-16 w-auto object-contain"
        />
        <h2 className="mt-4 text-2xl font-bold">Welcome to your personal space</h2>
        <p className="mt-2 text-sm text-muted">Use the menu on the left to navigate.</p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[420px] rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
