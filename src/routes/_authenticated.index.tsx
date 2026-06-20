import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  CreditCard,
  Link2,
  Hourglass,
  Percent,
  PiggyBank,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import {
  DashboardData,
  fetchReferrals,
  formatDate,
  formatProfit,
  ReferralRow,
} from "@/lib/api";

function iconForLabel(label: string) {
  const l = (label || "").toLowerCase();
  if (l.includes("balance")) return DollarSign;
  if (l.includes("discount percentage")) return CreditCard;
  if (l.includes("total referral")) return Link2;
  if (l.includes("discount amount")) return Hourglass;
  if (l.includes("commission amount")) return Percent;
  if (l.includes("earning")) return PiggyBank;
  if (l.includes("commission discount")) return Users;
  if (l.includes("bank transfer") || l.includes("transfer")) return ArrowLeftRight;
  return DollarSign;
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Referral Dashboard — Go Business" },
      {
        name: "description",
        content: "Track your referrals, earnings, and partner activity in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZE = 10;

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReferrals({ search: debounced || undefined, sort })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setPage(1);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, sort]);

  const referrals: ReferralRow[] = data?.referrals ?? [];
  const totalPages = Math.max(1, Math.ceil(referrals.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = useMemo(
    () => referrals.slice(start, start + PAGE_SIZE),
    [referrals, start],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Referral Dashboard</h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          Track your referrals, earnings, and partner activity in one place.
        </p>
      </div>

      {loading && !data && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {data && (
        <>
          <section role="region" aria-label="Overview metrics" className="rounded-2xl bg-card p-6 shadow-sm border border-border/50 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {data.metrics?.map((m, i) => {
                const Icon = iconForLabel(m.label);
                return (
                  <div
                    key={m.id ?? `${m.label}-${i}`}
                    className="rounded-xl border border-border bg-background p-5"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="mt-4 text-2xl font-extrabold text-foreground">{m.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{m.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Service summary" className="rounded-2xl bg-card p-6 shadow-sm border border-border/50 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Service summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <SummaryItem label="Service" value={data.serviceSummary?.service} accent />
              <SummaryItem label="Your Referrals" value={data.serviceSummary?.yourReferrals} />
              <SummaryItem label="Active Referrals" value={data.serviceSummary?.activeReferrals} />
              <SummaryItem label="Total Ref. Earnings" value={data.serviceSummary?.totalRefEarnings} />
            </div>
          </section>

          <section aria-label="Share referral" className="space-y-3">
            <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/50">
              <h2 className="text-lg font-semibold text-foreground">
                Refer friends and earn more
              </h2>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <CopyField label="Your Referral Link" value={data.referral?.link ?? ""} />
                <CopyField label="Your Referral Code" value={data.referral?.code ?? ""} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-sm border border-border/50 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">All referrals</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  Search
                <input
                  type="search"
                  aria-label="Search referrals"
                  placeholder="Name or service…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-full border border-input bg-background px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  Sort by date
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as "asc" | "desc")}
                    className="rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                        No matching entries
                      </td>
                    </tr>
                  )}
                  {visible.map((r, idx) => (
                    <tr
                      key={r.id}
                      onClick={() =>
                        navigate({
                          to: "/referral/$id",
                          params: { id: String(r.id) },
                        })
                      }
                      className={
                        (idx % 2 === 0 ? "bg-accent/40 " : "") +
                        "hover:bg-accent transition-colors cursor-pointer"
                      }
                    >
                      <td className="px-5 py-4 rounded-l-lg">
                        <span className="text-foreground hover:underline">
                          {r.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground">{r.serviceName}</td>
                      <td className="px-5 py-4 text-foreground">{formatDate(r.date)}</td>
                      <td className="px-5 py-4 font-semibold text-primary rounded-r-lg">
                        {formatProfit(r.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {referrals.length === 0
                  ? "Showing 0 of 0 entries"
                  : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, referrals.length)} of ${referrals.length} entries`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground disabled:opacity-50 hover:text-foreground"
                >
                  Previous
                </button>
                {totalPages > 1 &&
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={
                        n === safePage
                          ? "w-9 h-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                          : "w-9 h-9 inline-flex items-center justify-center rounded-full text-sm text-foreground hover:bg-accent"
                      }
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground disabled:opacity-50 hover:text-foreground"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number | undefined;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={
          "mt-3 text-2xl font-extrabold " + (accent ? "text-primary" : "text-foreground")
        }
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground"
        />
        <button
          onClick={copy}
          className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}