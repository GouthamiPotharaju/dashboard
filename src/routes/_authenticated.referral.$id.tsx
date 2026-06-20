import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchReferralById, formatDate, formatProfit, ReferralRow } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/referral/$id")({
  head: () => ({
    meta: [{ title: "Referral Details — Go Business" }],
  }),
  component: ReferralDetail,
});

function ReferralDetail() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<ReferralRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReferralById(id)
      .then((r) => !cancelled && setRow(r))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Referral Details</h1>
        <p className="mt-2 text-muted-foreground">Full information for this referral partner.</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && !row && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Referral not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find a referral with id {id}.
          </p>
        </div>
      )}

      {row && (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl font-extrabold text-foreground">{row.name}</h2>
            <span className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-primary">
              {row.serviceName}
            </span>
          </div>
          <div className="my-6 border-t border-border" />
          <dl className="divide-y divide-border/60">
            <DetailRow label="Referral ID" value={String(row.id)} />
            <DetailRow label="Name" value={row.name} />
            <DetailRow label="Service Name" value={row.serviceName} />
            <DetailRow label="Date" value={formatDate(row.date)} />
            <DetailRow label="Profit" value={formatProfit(row.profit)} highlight />
          </dl>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"col-span-2 text-base font-semibold " + (highlight ? "text-primary" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}