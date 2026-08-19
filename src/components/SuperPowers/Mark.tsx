/* THE MARK — the drawing on a superpower card, and the thing that bounces.
 *
 * An isometric box: a dark plate holding still and a lime mark that DROPS onto
 * it, squashes on impact and settles. It is the design's own export
 * (public/assets/svgviewer-output.svg), inlined here rather than pointed at with
 * an <img> — and that is the whole reason this file exists.
 *
 * WHY IT IS INLINE AND NOT AN <img>. The bounce has to fire when the card takes
 * its turn in the stack, which is a moment only this page knows about. An
 * external SVG is a document of its own: nothing in the host page can reach
 * inside it to start, stop or restart an animation, and CSS does not cross that
 * boundary either. So the file's own <style> would have to run the bounce on
 * page load, in every card at once, whether or not any of them was on screen —
 * which is the one behaviour the section is built to avoid. Inline, the mark is
 * ordinary DOM: the stylesheet holds it and SuperPowers/reveal.ts releases it.
 *
 * THE KEYFRAMES ARE NOT HERE. They are in global.css with the rest of the
 * section, because three cards carry three copies of this markup and three
 * identical @keyframes blocks in three <style> tags is the same animation
 * defined three times. What is left here is geometry and two class names.
 *
 * THE IDS ARE GONE for the same reason. The export names every path — Vector_2,
 * Group_650 — and nothing references any of them: no <use>, no url(#…), no
 * gradient. Three copies of this component on one page would be three copies of
 * every one of those ids, which is invalid and, the first time somebody adds a
 * gradient, silently wrong. Classes are what the stylesheet needs and classes
 * are what is left.
 *
 * THE PLATE IS KEPT AND IT IS NOT THE CARD. .powers-mark-plate is the box's own
 * dark silhouette — an isometric cube reads as a hexagon — and the lime faces
 * land ON it. It is close to the card's green and nearly reads as nothing, which
 * is the design's intent: it is what gives the mark somewhere to land. Delete
 * the one path if a future icon does not want it.
 *
 * Server-rendered, like letters() and bodyCopy(): the markup is static and
 * nothing here ships to the client.
 */
export default function Mark() {
  return (
    /* aria-hidden, and not a title or a role. The card already says BOX SEALER
       in a heading and says what it does in the sentence under this — the
       drawing is those same words drawn, and announcing it a third time is the
       same claim read out twice to anybody who cannot see it. Every other piece
       of artwork on this site is labelled where it carries information the copy
       does not; this one does not. */
    <svg
      className="powers-mark"
      viewBox="0 0 438 418"
      fill="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* The plate. Outside the bouncing group on purpose: it is the surface,
          and a surface that fell in with the thing landing on it would have
          nothing to land on. */}
      <path
        className="powers-mark-plate"
        d="M0.00153955 305.206L4.55388e-05 89.2424C1.79046e-05 85.2478 2.37728 81.6364 6.04642 80.0571L188.768 1.40775C190.884 0.497248 193.248 0.344759 195.463 0.976043L430.161 67.8737C434.457 69.0983 437.42 73.0236 437.42 77.4907V305.392C437.42 309.175 435.285 312.634 431.904 314.33L230.514 415.362C227.776 416.736 224.56 416.779 221.787 415.479L5.75873 314.261C2.24559 312.615 0.00156639 309.085 0.00153955 305.206Z"
      />

      {/* The design's own nesting, kept exactly. The outer group carries the
          mark's offset inside the frame as a plain SVG attribute; the inner one
          is what the keyframes move, and carries nothing of its own so the
          animation's transform is the only one on it. Collapsing the two would
          mean folding that offset into every one of the sixty keyframes. */}
      <g transform="translate(19.7734 26)">
        <g className="powers-mark-jump">
          <path
            transform="translate(0 74.0033)"
            d="M144.171 52.2174L204.988 76.8319C207.226 77.7909 208.744 79.9487 208.744 82.4261L209.464 283.978C209.464 288.453 204.828 291.41 200.832 289.492L152.802 266.716L3.51637 198.626C1.3586 197.667 0 195.509 0 193.112V1.54971C0 -1.08756 6.23356 -0.0486329 6.95281 2.34889L70.4072 28.7216C72.6449 29.6806 74.0834 31.8384 74.1634 34.3159L74.4031 93.2949C74.4031 95.6924 75.8416 97.9301 78.0793 98.8092L126.989 119.588C130.985 121.266 135.38 118.389 135.38 114.073L135.94 57.7317C135.94 53.496 140.335 50.619 144.251 52.2174H144.171Z"
          />
          <path
            transform="translate(10.3887)"
            d="M63.4951 93.1998L1.15955 68.0258C-0.438797 67.3865 -0.358879 65.1488 1.23947 64.5894C8.43204 61.9521 11.9484 59.9542 20.1799 56.6775L166.109 0.415682C167.388 -0.0638228 168.746 -0.14374 170.105 0.255847L210.703 12.9627C215.978 14.641 216.457 21.9135 211.422 24.2311L68.6099 93.1998C67.0115 93.9191 65.1734 93.9191 63.5751 93.1998H63.4951Z"
          />
          <path
            transform="translate(154.701 36.8038)"
            d="M150.866 0.621552L3.4986 69.1108C-1.29644 71.3485 -1.13662 78.3013 3.81826 80.2193L69.3506 106.113L68.3915 115.143C68.3915 115.143 68.3915 115.543 68.3915 115.783V322.449C68.3915 327.084 73.3464 329.961 77.4222 327.724L238.056 238.536C239.974 237.497 241.173 235.419 241.173 233.261V28.3529C241.253 25.6357 239.415 23.2382 236.778 22.5189L155.022 0.221968C153.663 -0.177619 152.145 -0.0177849 150.866 0.541637V0.621552Z"
          />
          <path
            transform="translate(88.6055 21.9771)"
            d="M4.47538 142.737L20.299 149.21C24.2949 150.889 28.6904 147.852 28.6104 143.536L28.051 92.2292C28.051 89.8317 29.4096 87.6739 31.5674 86.635L183.73 16.1478C188.845 13.8302 188.206 6.39788 182.851 4.87945L166.868 0.244243C165.429 -0.155344 163.991 -0.0754272 162.632 0.563912L3.51637 75.2068C1.3586 76.2457 0 78.4035 0 80.7211L0.639339 137.223C0.639339 139.62 2.15777 141.858 4.39546 142.737H4.47538Z"
          />
        </g>
      </g>
    </svg>
  );
}
