/**
 * Where the App Store and Play badges go — and what stands there until the
 * apps are listed.
 *
 * ---------------------------------------------------------------------------
 * THE BADGES ARE NOT DRAWN, AND THAT IS DELIBERATE.
 *
 * Both stores publish their badge as a locked artwork with its own guidelines:
 * fixed proportions, minimum clear space, and no recolouring. A hand-built
 * lookalike is a trademark problem rather than a design shortcut, and neither
 * store will pass a listing that ships one.
 *
 * More to the point, a badge that links nowhere is worse than no badge. The
 * apps are not listed yet (plan 16 is 0/8 and the store accounts do not
 * exist), so a real-looking badge would be a button that lies about what it
 * does, on the page whose whole argument is that this app is honest with you.
 *
 * So this states the situation in one sentence, and `STORE_URLS` is the one
 * place to change when the listings are live: drop the official artwork into
 * `public/`, fill in the two URLs, and this renders links instead.
 * ---------------------------------------------------------------------------
 */

/** Fill these in when the listings are live. `null` means "not yet". */
export const STORE_URLS: { appStore: string | null; play: string | null } = {
  appStore: null,
  play: null,
};

export function StoreBadges() {
  const listed = STORE_URLS.appStore !== null || STORE_URLS.play !== null;

  if (!listed) {
    return (
      <div
        id="get"
        className="rounded-[26px] border border-rule bg-surface px-7 py-6"
      >
        <p className="text-[17px] leading-[1.7] text-ink">
          Calma is not on the stores yet.
        </p>
        <p className="mt-2 max-w-[520px] text-[16px] leading-[1.7] text-ink-muted">
          There is no waiting list and nothing to sign up for. When it is
          ready, it will be here — and on the App Store and Google Play.
        </p>
      </div>
    );
  }

  return (
    <div id="get" className="flex flex-wrap items-center gap-4">
      {STORE_URLS.appStore === null ? null : (
        <a href={STORE_URLS.appStore} className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/app-store.svg"
            alt="Download Calma on the App Store"
            width={160}
            height={54}
          />
        </a>
      )}
      {STORE_URLS.play === null ? null : (
        <a href={STORE_URLS.play} className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/google-play.svg"
            alt="Get Calma on Google Play"
            width={180}
            height={54}
          />
        </a>
      )}
    </div>
  );
}
