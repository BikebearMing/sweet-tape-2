/* eslint-disable @next/next/no-img-element */
import { tapes, cssVars } from "@/data/tapes";

/* The orbit. Server-rendered: the buttons are static, only their position is
 * animated.
 *
 * Each button carries its tape's whole payload — palette as custom properties,
 * artwork and copy as data attributes. That is deliberate: the engine works
 * entirely off the DOM, so a selection needs no lookup back into React state and
 * no re-render mid-tween. The button IS the record.
 */
export default function RollPicker() {
  return (
    <div className="roll-parent">
      <div className="rail-track">
        {tapes.map((tape) => (
          <button
            key={tape.id}
            type="button"
            data-index={tape.id}
            aria-label={tape.label}
            style={cssVars(tape.colours)}
            data-card={tape.card}
            data-showcase={tape.showcase.join("|")}
            data-tags={tape.tags.join("|")}
            data-copy={tape.copy}
          >
            <span className="roll-ring" aria-hidden="true" />
            {/* Plain img, not next/image: the roll art is a fixed-size PNG with
                transparency that gains nothing from resizing, and next/image's
                wrapper would sit between the button and the element the hover
                swing transforms. */}
            <img src={tape.roll} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
