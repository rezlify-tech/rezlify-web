"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { StarPicker, Stars } from "@/components/reviews/Stars";
import { Badge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import {
  OrderError,
  deliveryLabels,
  disputeReasons,
  enterReleaseCode,
  fetchOrder,
  leaveReview,
  orderAction,
  replyToReview,
  reportProblem,
  statusFor,
  type DisputeReason,
  type Order,
  type OrderAction,
} from "@/lib/orders";
import { useSessionStatus } from "@/lib/session";
import { cn } from "@/lib/utils";

const DEV = process.env.NODE_ENV !== "production";

const primary =
  "inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-60";
const secondary =
  "inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-line-strong bg-card px-5 text-[15px] font-semibold transition-colors hover:bg-sand disabled:opacity-60";
const quiet = "inline-flex h-10 w-full items-center justify-center text-sm font-semibold text-muted transition-colors hover:text-ink";

const dateTime = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Re-renders every `ms` so countdowns tick. */
function useNow(ms: number, active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms, active]);
  return now;
}

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

type Dialog = null | "confirm" | "handover" | "refund" | "cancel" | "code" | "dispute";

export function OrderView({ id }: { id: string }) {
  const router = useRouter();
  const session = useSessionStatus();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const statusRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchOrder(id);
      setOrder(next);
      setLoadError("");
    } catch (e) {
      if (e instanceof OrderError && e.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);
      } else if (e instanceof OrderError && e.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(e instanceof Error ? e.message : "We couldn't load this order.");
      }
    }
  }, [id, router]);

  useEffect(() => {
    if (session === "guest") router.replace(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);
    if (session === "authenticated") void load();
  }, [session, id, load, router]);

  // Keep it fresh: fast while waiting for a transfer, slower otherwise, and when the tab comes back.
  useEffect(() => {
    statusRef.current = order?.status ?? null;
  }, [order]);
  useEffect(() => {
    if (session !== "authenticated") return;
    const final = ["released", "refunded", "cancelled"];
    const tick = () => {
      if (document.visibilityState !== "visible" || final.includes(statusRef.current ?? "")) return;
      void load();
    };
    const fast = window.setInterval(() => statusRef.current === "pending_payment" && tick(), 4000);
    const slow = window.setInterval(() => statusRef.current !== "pending_payment" && tick(), 20000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(fast);
      window.clearInterval(slow);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [session, load]);

  async function run(fn: () => Promise<Order>) {
    setBusy(true);
    setError("");
    try {
      setOrder(await fn());
      setDialog(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const act = (action: OrderAction) => run(() => orderAction(id, action));
  const openDialog = (d: Dialog) => {
    setError("");
    setDialog(d);
  };

  if (notFound) {
    return (
      <Empty title="Order not found" body="It may belong to another account.">
        <Link href="/account/orders" className={cn(primary, "w-auto")}>
          Your orders
        </Link>
      </Empty>
    );
  }
  if (!order) {
    return loadError ? (
      <Empty title="We couldn't load this order" body={loadError}>
        <button type="button" onClick={() => void load()} className={cn(primary, "w-auto")}>
          Try again
        </button>
      </Empty>
    ) : (
      <Skeleton />
    );
  }

  const selling = order.role === "selling";
  const badge = statusFor(order);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/account/orders${selling ? "?tab=selling" : ""}`} className="text-sm font-semibold text-muted hover:text-ink">
        ← Orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em]">Order {order.reference}</h1>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Link href={listingHref(order.listing)} className="flex gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:bg-paper sm:p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
              {order.listing.photoUrl ? <Image src={order.listing.photoUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{order.listing.title}</p>
              <p className="mt-1 text-base font-extrabold">{formatNaira(order.itemAmount)}</p>
            </div>
          </Link>

          <MainCard order={order} busy={busy} onDialog={openDialog} onAct={act} />

          {order.status === "released" && (order.review || order.actions.review) ? <ReviewBox order={order} onSaved={load} /> : null}

          {error && !dialog ? <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p> : null}
        </div>

        <aside className="space-y-5">
          <Timeline order={order} />
          <section className="rounded-2xl border border-line bg-card p-4 text-sm">
            <dl className="space-y-2">
              <Row label="Item">{formatNaira(order.itemAmount)}</Row>
              {selling && order.feeAmount !== undefined ? <Row label="Rezlify fee">−{formatNaira(order.feeAmount)}</Row> : null}
              {selling && order.sellerAmount !== undefined ? (
                <div className="flex justify-between border-t border-line pt-2">
                  <dt className="font-bold">You receive</dt>
                  <dd className="font-extrabold">{formatNaira(order.sellerAmount)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs font-semibold text-muted">{selling ? "Buyer" : "Seller"}</p>
              <p className="mt-0.5 flex items-center gap-1 font-semibold">
                {order.otherUser.name}
                {order.otherUser.isVerified ? <ShieldCheck className="h-4 w-4 text-brand-500" /> : null}
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">Delivery</p>
              <p className="mt-0.5">{deliveryLabels[order.deliveryMethod]}</p>
              {order.deliveryNote ? <p className="mt-1 whitespace-pre-line text-xs text-muted">{order.deliveryNote}</p> : null}
              <Link href="/messages" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand">
                Messages
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {dialog === "confirm" ? (
        <ConfirmDialog
          title="Got the item and happy with it?"
          body={`${formatNaira(order.itemAmount)} will be sent to ${order.otherUser.name}. This can't be undone.`}
          action="Yes, release payment"
          busy={busy}
          error={error}
          onConfirm={() => act("confirm")}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "handover" ? (
        <ConfirmDialog
          title={order.deliveryMethod === "meetup" ? "Handed it over?" : "Sent it?"}
          body="The buyer will be asked to confirm. If they report nothing in time, you're paid automatically."
          action="Yes, mark as handed over"
          busy={busy}
          error={error}
          onConfirm={() => act("handed-over")}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "refund" ? (
        <ConfirmDialog
          title="Refund the buyer?"
          body={`${order.otherUser.name} gets ${formatNaira(order.itemAmount)} back and your ad goes live again.`}
          action="Refund buyer"
          danger
          busy={busy}
          error={error}
          onConfirm={() => act("refund")}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "cancel" ? (
        <ConfirmDialog
          title="Cancel this order?"
          body="Don't cancel if you've already sent the money."
          action="Cancel order"
          danger
          busy={busy}
          error={error}
          onConfirm={() => act("cancel")}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "code" ? (
        <CodeDialog busy={busy} error={error} onSubmit={(code) => run(() => enterReleaseCode(id, code))} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "dispute" ? (
        <DisputeDialog
          busy={busy}
          error={error}
          onSubmit={(reason, text) => run(() => reportProblem(id, reason, text))}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ the main card ------------------------------ */

function MainCard({
  order,
  busy,
  onDialog,
  onAct,
}: {
  order: Order;
  busy: boolean;
  onDialog: (d: Dialog) => void;
  onAct: (a: OrderAction) => Promise<boolean>;
}) {
  const selling = order.role === "selling";
  const { actions } = order;
  const releaseBy = order.autoReleaseAt ? dateTime.format(new Date(order.autoReleaseAt)) : null;

  switch (order.status) {
    case "pending_payment":
      return selling ? (
        <Card title="Waiting for the buyer to pay">
          <p>You&apos;ll be told here and in chat when the money is in. Don&apos;t hand anything over before then.</p>
        </Card>
      ) : (
        <PaymentBox order={order} busy={busy} onAct={onAct} onCancel={() => onDialog("cancel")} />
      );

    case "paid":
    case "handed_over":
      if (selling) {
        return (
          <Card
            title={order.status === "paid" ? "Paid. Now hand it over." : "Waiting for the buyer to confirm"}
            trust={order.status === "paid" ? "The money is held by Rezlify." : undefined}
          >
            <p>
              {order.status === "paid"
                ? order.deliveryMethod === "meetup"
                  ? "At the meetup, let the buyer check the item. Ask for their 6-digit code and enter it to get paid."
                  : "Send the item, then mark it as sent. You're paid when the buyer confirms."
                : releaseBy
                  ? `If the buyer reports nothing by ${releaseBy}, you're paid automatically.`
                  : "You're paid as soon as the buyer confirms."}
            </p>
            <div className="mt-4 space-y-2">
              {actions.enterCode ? (
                <button type="button" onClick={() => onDialog("code")} className={primary}>
                  Enter buyer&apos;s code
                </button>
              ) : null}
              {actions.handOver ? (
                <button type="button" onClick={() => onDialog("handover")} className={secondary}>
                  {order.deliveryMethod === "meetup" ? "Mark as handed over" : "Mark as sent"}
                </button>
              ) : null}
              {actions.refund ? (
                <button type="button" onClick={() => onDialog("refund")} className={quiet}>
                  Can&apos;t sell it? Refund the buyer
                </button>
              ) : null}
            </div>
          </Card>
        );
      }
      return (
        <Card
          title={order.status === "paid" ? "Paid. Your money is held safely." : "The seller says it's handed over"}
          trust="The seller isn't paid until you confirm."
        >
          {order.releaseCode ? (
            <div className="rounded-xl bg-sand p-4 text-center">
              <p className="text-xs font-semibold text-muted">Your release code</p>
              <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.3em]">{order.releaseCode}</p>
              <p className="mt-2 text-xs text-muted">Only give this to the seller after you&apos;ve checked the item. It pays them.</p>
            </div>
          ) : null}
          {order.status === "handed_over" && releaseBy ? (
            <p className="mt-3">
              Report a problem before <span className="font-semibold text-ink">{releaseBy}</span>. After that, the money goes to the seller.
            </p>
          ) : null}
          <div className="mt-4 space-y-2">
            {actions.confirm ? (
              <button type="button" onClick={() => onDialog("confirm")} className={primary}>
                I&apos;ve received it
              </button>
            ) : null}
            {actions.dispute ? (
              <button type="button" onClick={() => onDialog("dispute")} className={secondary}>
                Report a problem
              </button>
            ) : null}
          </div>
        </Card>
      );

    case "confirmed":
      return selling ? (
        <Card title={order.payout?.status === "failed" ? "Payout delayed" : "Payout on the way"}>
          <p>
            {order.payout?.status === "failed"
              ? "We couldn't reach your bank. We'll keep trying automatically. Check your bank details on the verify page."
              : "The buyer confirmed. Your money is being sent to your bank account."}
          </p>
        </Card>
      ) : (
        <Card title="Confirmed">
          <p>Thanks. The seller is being paid.</p>
        </Card>
      );

    case "released":
      return (
        <Card title={selling ? "Paid out" : "Order complete"} trust={selling ? `${formatNaira(order.sellerAmount ?? 0)} sent to your bank.` : undefined}>
          <p>{selling ? "This sale is complete." : "Enjoy your item."}</p>
        </Card>
      );

    case "disputed":
      return (
        <Card title="Problem reported">
          <p>The money is on hold while our team looks into it. We&apos;ll contact you both.</p>
          {order.dispute ? (
            <div className="mt-3 rounded-xl bg-sand p-3">
              <p className="text-xs font-semibold text-muted">{order.dispute.reasonLabel}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink">{order.dispute.description}</p>
            </div>
          ) : null}
        </Card>
      );

    case "refunded":
      return (
        <Card title="Refunded">
          <p>
            {formatNaira(order.itemAmount)} {selling ? "was returned to the buyer." : "is on its way back to your bank account."}
          </p>
          {order.dispute?.resolutionNote ? <p className="mt-2 text-xs">{order.dispute.resolutionNote}</p> : null}
        </Card>
      );

    case "cancelled":
      return (
        <Card title="Cancelled">
          <p>{selling ? "The buyer didn't pay in time or cancelled." : "This order was cancelled. If you sent money after it closed, it will be refunded."}</p>
        </Card>
      );
  }
}

function Card({ title, trust, children }: { title: string; trust?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h2 className="text-lg font-extrabold tracking-[-0.01em]">{title}</h2>
      {trust ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
          {trust}
        </p>
      ) : null}
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/* ------------------------------ review ------------------------------ */

function ReviewBox({ order, onSaved }: { order: Order; onSaved: () => Promise<void> }) {
  const selling = order.role === "selling";
  const review = order.review;
  const [editing, setEditing] = useState(!review && order.actions.review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await onSaved();
      setEditing(false);
      setReply("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Seller: no review yet means nothing to show.
  if (selling && !review) return null;

  if (!selling && editing) {
    return (
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <h2 className="text-lg font-extrabold tracking-[-0.01em]">{review ? "Change your review" : `How was ${order.otherUser.name.split(" ")[0]}?`}</h2>
        <p className="mt-0.5 text-sm text-muted">Your rating helps other buyers. Only your first name shows.</p>
        <div className="mt-3">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="What went well? Anything others should know? (optional)"
          className="mt-3 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
        />
        {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!rating || busy}
            onClick={() => save(() => leaveReview(order.id, rating, comment))}
            className={cn(primary, "sm:w-auto")}
          >
            {busy ? "Posting…" : review ? "Save changes" : "Post review"}
          </button>
          {review ? (
            <button type="button" onClick={() => setEditing(false)} className={cn(quiet, "w-auto px-4")}>
              Cancel
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (!review) return null;

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-extrabold">{selling ? "The buyer's review" : "Your review"}</h2>
        {!selling && order.actions.review ? (
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">
            Edit
          </button>
        ) : null}
      </div>
      <Stars value={review.rating} className="mt-2 text-lg" />
      {review.comment ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{review.comment}</p> : null}

      {review.reply ? (
        <div className="mt-3 rounded-xl bg-sand px-3 py-2.5 text-sm">
          <p className="text-xs font-bold text-ink-3">{selling ? "Your reply" : "Seller's reply"}</p>
          <p className="mt-0.5 whitespace-pre-line text-ink-3">{review.reply}</p>
        </div>
      ) : null}

      {selling && order.actions.replyToReview ? (
        <div className="mt-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 1000))}
            rows={2}
            placeholder="Reply publicly (once). Keep it polite."
            className="w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
          />
          {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}
          <button
            type="button"
            disabled={reply.trim().length < 2 || busy}
            onClick={() => save(() => replyToReview(review.id, reply))}
            className={cn(secondary, "mt-2 h-10 text-sm sm:w-auto")}
          >
            {busy ? "Posting…" : "Post reply"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------ paying ------------------------------ */

function PaymentBox({
  order,
  busy,
  onAct,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onAct: (a: OrderAction) => Promise<boolean>;
  onCancel: () => void;
}) {
  const p = order.payment;
  const now = useNow(1000, Boolean(p?.expiresAt));
  const [copied, setCopied] = useState("");

  if (!p) {
    return (
      <Card title="Checking your payment">
        <p>This takes a moment.</p>
      </Card>
    );
  }

  const left = p.expiresAt ? new Date(p.expiresAt).getTime() - now : null;
  const expired = left !== null && left <= 0;

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      /* not allowed */
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-[-0.01em]">Transfer exactly</h2>
          <p className="mt-0.5 text-2xl font-extrabold">{formatNaira(p.amount)}</p>
        </div>
        {left !== null ? (
          <span className={cn("rounded-lg px-2.5 py-1 font-mono text-sm font-bold", expired ? "bg-danger-50 text-danger-600" : "bg-sand text-ink")}>
            {expired ? "Expired" : mmss(left)}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
        <CopyRow label="Account number" value={p.accountNumber} mono copied={copied === "acct"} onCopy={() => copy("acct", p.accountNumber)} />
        <CopyRow label="Bank" value={p.bankName} />
        {p.accountName ? <CopyRow label="Account name" value={p.accountName} /> : null}
        <CopyRow
          label="Amount"
          value={formatNaira(p.amount)}
          copied={copied === "amt"}
          onCopy={() => copy("amt", String(Math.round(p.amount / 100)))}
        />
      </dl>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" />
        This account is for this order only. Rezlify holds the money until you confirm you have the item.
      </p>
      <p className="mt-2 text-xs text-muted">
        {expired ? "Time ran out. Go back to the item to start again." : "This page updates by itself once your transfer arrives."}
      </p>

      <div className="mt-4 space-y-2">
        {DEV && !expired ? (
          <button type="button" disabled={busy} onClick={() => void onAct("simulate-payment")} className={secondary}>
            {busy ? "Paying…" : "Simulate payment (test only)"}
          </button>
        ) : null}
        {order.actions.cancel && !expired ? (
          <button type="button" onClick={onCancel} className={quiet}>
            Cancel order
          </button>
        ) : null}
      </div>
    </section>
  );
}

function CopyRow({ label, value, mono, copied, onCopy }: { label: string; value: string; mono?: boolean; copied?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold text-muted">{label}</dt>
        <dd className={cn("truncate font-bold", mono ? "font-mono text-lg tracking-wider" : "text-sm")}>{value}</dd>
      </div>
      {onCopy ? (
        <button type="button" onClick={onCopy} className="h-8 shrink-0 rounded-lg border border-line-strong px-3 text-xs font-semibold hover:bg-sand">
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------ side panel ------------------------------ */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

function Timeline({ order }: { order: Order }) {
  const stopped = order.status === "cancelled" || order.status === "refunded" || order.status === "disputed";
  const steps: { label: string; at: string | null }[] = [
    { label: "Ordered", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: order.deliveryMethod === "meetup" ? "Handed over" : "Sent", at: order.handedOverAt },
    { label: "Confirmed", at: order.confirmedAt },
    { label: order.role === "selling" ? "Paid out" : "Complete", at: order.releasedAt },
  ];
  const end =
    order.status === "cancelled"
      ? { label: "Cancelled", at: order.cancelledAt }
      : order.status === "refunded"
        ? { label: "Refunded", at: order.refundedAt }
        : order.status === "disputed"
          ? { label: "Problem reported", at: order.dispute?.openedAt ?? null }
          : null;

  const shown = stopped ? [...steps.filter((s) => s.at), end!] : steps;

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <ol className="space-y-3">
        {shown.map((s, i) => {
          const done = Boolean(s.at);
          const last = stopped && i === shown.length - 1;
          return (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  last ? (order.status === "disputed" ? "bg-danger-500" : "bg-ink-3") : done ? "bg-ink" : "bg-line-strong",
                )}
              />
              <span className={cn("flex-1", done ? "font-semibold text-ink" : "text-subtle")}>{s.label}</span>
              {s.at ? <span className="text-xs text-muted">{dateTime.format(new Date(s.at))}</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------ dialogs ------------------------------ */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[20px] bg-card p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[var(--shadow-lift)] animate-fade-up sm:rounded-[20px] sm:pb-5"
      >
        <h2 className="text-lg font-extrabold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  action,
  danger,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  action: string;
  danger?: boolean;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
      <div className="mt-5 space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={cn(primary, danger && "bg-danger-600 hover:bg-danger-500")}
        >
          {busy ? "Please wait…" : action}
        </button>
        <button type="button" onClick={onClose} className={quiet}>
          Not now
        </button>
      </div>
    </Modal>
  );
}

function CodeDialog({
  busy,
  error,
  onSubmit,
  onClose,
}: {
  busy: boolean;
  error: string;
  onSubmit: (code: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  return (
    <Modal title="Enter the buyer's code" onClose={onClose}>
      <p className="mt-1 text-sm text-muted">The buyer finds it on their order page. Only take it after they&apos;ve checked the item.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) onSubmit(code);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          aria-label="6-digit code"
          className="mt-4 h-14 w-full rounded-xl border border-line-strong bg-card text-center font-mono text-2xl font-bold tracking-[0.4em] outline-none focus:border-ink"
        />
        {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
        <div className="mt-5 space-y-2">
          <button type="submit" disabled={busy || code.length !== 6} className={primary}>
            {busy ? "Checking…" : "Confirm and get paid"}
          </button>
          <button type="button" onClick={onClose} className={quiet}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DisputeDialog({
  busy,
  error,
  onSubmit,
  onClose,
}: {
  busy: boolean;
  error: string;
  onSubmit: (reason: DisputeReason, text: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [text, setText] = useState("");
  const ready = reason !== null && text.trim().length >= 10;

  return (
    <Modal title="Report a problem" onClose={onClose}>
      <p className="mt-1 text-sm text-muted">We&apos;ll hold the money and look into it.</p>
      <div className="mt-4 space-y-1.5">
        {disputeReasons.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReason(r.id)}
            aria-pressed={reason === r.id}
            className={cn(
              "flex h-11 w-full items-center rounded-xl border px-3 text-left text-sm font-semibold transition-colors",
              reason === r.id ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:bg-paper",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 2000))}
        rows={3}
        placeholder="What happened?"
        className="mt-3 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
      />
      {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}
      <div className="mt-4 space-y-2">
        <button type="button" disabled={busy || !ready} onClick={() => reason && onSubmit(reason, text.trim())} className={primary}>
          {busy ? "Sending…" : "Report problem"}
        </button>
        <button type="button" onClick={onClose} className={quiet}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------ states ------------------------------ */

function Empty({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-[20px] border border-line bg-card px-6 py-12 text-center">
      <h1 className="text-lg font-extrabold">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <span className="skeleton block h-4 w-16 rounded" />
      <span className="skeleton mt-4 block h-8 w-56 rounded" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <span className="skeleton block h-24 rounded-2xl" />
          <span className="skeleton block h-64 rounded-2xl" />
        </div>
        <span className="skeleton block h-56 rounded-2xl" />
      </div>
    </div>
  );
}
