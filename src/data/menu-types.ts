/* The menu's shape, and the half of it that is safe anywhere.
 *
 * Split for the reason every one of these files splits: its sibling,
 * ./menu.ts, imports the Payload config and drags the Postgres adapter with it,
 * and components/Menu is a client component. This is the half that can cross
 * that line — which here is the whole of it, since a menu row is three strings.
 */

/** One row of the pull-down. */
export type MenuItem = {
  label: string;
  href: string;
  /** Shown behind the row on hover. Never empty — see FALLBACK_THUMB. */
  thumb: string;
};
