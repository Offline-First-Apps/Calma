import type { ReactNode } from "react";

/**
 * The furniture W1 and W2 share, in one place.
 *
 * The design's caption for W2 is explicit that this is the point:
 * "structurally the twin of W1 so the two pages read as one document — same
 * header, measure, standfirst and section rhythm." Two hand-built pages drift
 * on the first edit, and the drift is what makes a policy page look like it
 * was written by a different company from the one that wrote the app.
 *
 * A 720px measure, a serif standfirst that answers the question before the
 * clauses do, and numbered sections separated by hairlines rather than boxes.
 * No accordions — a policy that has to be unfolded is a policy somebody is
 * being discouraged from reading — and no sidebar table of contents.
 */

export function DocumentPage({
  title,
  updated,
  standfirst,
  children,
}: {
  title: string;
  /** Human date. Stated plainly because a policy with no date is a rumour. */
  updated: string;
  standfirst: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[720px] px-6 pb-4 pt-16 sm:pt-20">
      <p className="text-[14px] uppercase tracking-[0.14em] text-ink-faint">
        Last updated {updated}
      </p>

      <h1 className="mt-4 font-serif text-[40px] leading-[1.15] tracking-[-0.01em] text-ink">
        {title}
      </h1>

      {/* The plain-English answer first. Somebody reading this at 2am wants to
          know the shape of it before they read the clauses, and burying that
          under numbered sections is how policies get skipped. */}
      <p className="mt-6 text-[20px] leading-[1.6] text-ink-secondary">
        {standfirst}
      </p>

      {children}
    </article>
  );
}

/** The sage cards W2 puts above every clause. Promises, not clauses. */
export function Promises({ children }: { children: ReactNode }) {
  return <div className="mt-10 grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Promise({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-sage-border bg-sage-surface px-7 py-6">
      <h2 className="text-[18px] font-medium text-sage-ink">{title}</h2>
      <p className="mt-2 text-[16px] leading-[1.7] text-ink-secondary">
        {children}
      </p>
    </div>
  );
}

/**
 * W1's summary card — "In plain words", then the three things that actually
 * matter, as bullets.
 *
 * W2 states its promises as two side-by-side sage cards; W1 draws one wide
 * card with a heading and a short list. They are not the same component and
 * collapsing them would lose the distinction the design is making: W2's cards
 * are two independent promises, W1's list is one summary of a longer document
 * that follows. Same sage material, different shape.
 *
 * A real `<ul>` rather than styled divs, because a screen reader announcing
 * "list, three items" is the whole point of a summary — it tells somebody how
 * much they are about to be told before they commit to reading it.
 */
export function PlainWords({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="mt-10 rounded-[26px] border border-sage-border bg-sage-surface px-7 py-6">
      <h2 className="text-[18px] font-medium text-sage-ink">{title}</h2>
      <ul className="mt-3 flex list-none flex-col gap-3 p-0">
        {items.map((item) => (
          {/* The marker is a middle dot rather than a disc, matching the
              numbered headings below. It is `aria-hidden` because the list
              role already carries the structure, and a screen reader reading
              "middle dot" before every line is noise. */}
          <li
            key={item}
            className="relative pl-5 text-[16px] leading-[1.7] text-ink-secondary"
          >
            <span aria-hidden className="absolute left-0 text-sage">
              &middot;
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A numbered section.
 *
 * The number is part of the visible heading rather than a `list-style`, so it
 * survives being read aloud and being linked to — and so the middle dot from
 * the design ("1 · What we collect") is a real character rather than a
 * generated marker a screen reader may or may not announce.
 */
export function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <section className="mt-10 border-t border-rule pt-9">
      <h2 id={id} className="font-serif text-[26px] leading-[1.25] text-ink">
        <span className="text-ink-faint">{index} · </span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-[17px] leading-[1.75] text-ink-secondary">
        {children}
      </div>
    </section>
  );
}
