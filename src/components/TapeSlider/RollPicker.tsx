/* eslint-disable @next/next/no-img-element */
import { cssVars, type Slide } from "@/data/homepage-types";
import { stripAttr } from "./strips";

/* The orbit. Server-rendered: the buttons are static, only their position is
 * animated.
 *
 * Each button carries its slide's whole payload — palette as custom properties,
 * artwork and copy as data attributes. That is deliberate: the engine works
 * entirely off the DOM, so a selection needs no lookup back into React state and
 * no re-render mid-tween. The button IS the record.
 *
 * THE SLIDES ARE THE HOME PAGE'S AND NOT THE TAPES'. This read the tapes
 * collection until the two were separated: what a product IS and what the front
 * door is showing are different decisions, made by different people at different
 * times, and one record answering both meant adding a tape put it on the home
 * page. See src/globals/Homepage.ts.
 *
 * data-strip is the odd one out in that it is not a field of the slide: it is
 * the strip of this roll's own film that the two showcase photographs are held
 * down with — artwork, underside and box, packed the way data-showcase is.
 * Derived from the slide's key rather than authored, so it rides along here
 * with everything else the engine reads. See strips.ts.
 */
export default function RollPicker({ rolls }: { rolls: Slide[] }) {
  return (
    <div className="roll-parent">
      <div className="rail-track">
        {rolls.map((tape) => (
          <button
            key={tape.id}
            type="button"
            data-index={tape.id}
            aria-label={tape.label}
            style={cssVars(tape.colours)}
            data-card={tape.card}
            data-model={tape.model}
            data-word={tape.word}
            data-showcase={tape.showcase.join("|")}
            data-strip={stripAttr(tape.id)}
            data-tags={tape.tags.join("|")}
            data-copy={tape.copy}
          >
            <span className="roll-ring" aria-hidden="true" />
            {/* Plain img, not next/image: the roll art is a fixed-size PNG with
                transparency that gains nothing from resizing, and next/image's
                wrapper would sit between the button and the element the hover
                swing transforms. */}
            <img src={tape.thumb} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
