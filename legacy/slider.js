/* Sweet Tape — orbiting roll selector.
 *
 * Rolls sit on a circle; selecting one spins the ring until it reaches the
 * 9 o'clock slot. Everything else in the section clears out, the colour sheet
 * sweeps down, and each piece returns once the colour behind it has settled.
 *
 *   0.00 |------ ring closes ------|
 *   0.00 |- THE drops -|
 *   0.06   |--- CREATIVE drops ---|
 *   0.10  |------- card turns -------|
 *   0.12      |----------- orbit travels ----------|
 *   0.12      |- chips out -|······· held off screen ·······|- chips in -|
 *   0.75                        |------ ring opens ------|
 *   0.75                        |------- colour sheet -------|
 *   0.96                          |- THE rises -|
 *   1.24                                |- CREATIVE rises -|
 *                                                          ~2.1s total
 */
/* Smooth scrolling. Lenis is driven from GSAP's ticker rather than its own rAF
   loop, so scroll and animation are updated on the same frame — two loops would
   let the parallax read a scroll position one frame stale and jitter.
   lagSmoothing(0) stops GSAP absorbing a slow frame, which would desync them. */
(function () {
  if (typeof Lenis === "undefined" || typeof gsap === "undefined") return;
  var lenis = new Lenis({ duration: 1.1 });
  gsap.ticker.add(function (t) {
    lenis.raf(t * 1000); // gsap.ticker counts seconds, lenis wants ms
  });
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
})();

(function () {
  var parent = document.querySelector(".roll-parent");
  var track = parent && parent.querySelector(".rail-track");
  if (!track || typeof gsap === "undefined") return;

  var rolls = gsap.utils.toArray(".rail-track button", track);
  if (!rolls.length) return;

  var rings = rolls.map(function (b) {
    return b.querySelector(".roll-ring");
  });

  // glyphs are the images inside .glyph, not the wrappers: the wrapper holds
  // the arc, the image does the moving.
  var letters = gsap.utils.toArray(".top-title img");
  var glyphs = gsap.utils.toArray(".bottom-title .glyph img");
  var topWord = document.querySelector(".top-title");
  var bottomWord = document.querySelector(".bottom-title");
  var card = document.querySelector(".key-visual img");
  var showcase = gsap.utils.toArray(".middle img.showcase");
  var left = document.querySelector(".left");
  var tagBox = left && left.querySelector(".tag");
  var copyBox = left && left.querySelector(".subtext .h5");
  var chips = [];
  var root = document.documentElement;

  var subhead = document.querySelector(".subhead");
  var sweep = document.querySelector(".sweep-paint");
  var sweepInner = document.querySelector(".sweep-inner");
  var subheadNext = sweep && sweep.querySelector(".subhead--next");

  var bgOverlay = document.querySelector(".bg-overlay");
  var bgBase = bgOverlay && bgOverlay.querySelector(".bg-layer--base");
  var bgNext = bgOverlay && bgOverlay.querySelector(".bg-layer--next");
  var hasBg = !!(bgBase && bgNext);

  var STEP = 360 / rolls.length; // 4 rolls -> 90deg apart
  var ACTIVE_ANGLE = 180; // 9 o'clock, in CSS angle terms (0 = 3 o'clock)

  // The two overlaps are what blend the close/travel/open into one gesture.
  // Set them to 0 for three discrete beats.
  var RING_OUT = 0.46;
  var TRAVEL = 0.85;
  var RING_IN = 0.55;
  var CLOSE_OVERLAP = 0.34; // orbit starts this early, before the close ends
  var OPEN_LEAD = 0.22; // ring starts this early, before the roll settles

  var EASE = "sine.inOut";
  var EASE_OPEN = "back.out(1.6)";
  var EASE_CLOSE = "back.in(0.9)";

  var BG_REVEAL = 0.85; // colour sheet sweeping down over the stage
  var BG_EASE = "power2.out";

  var WORD_DOWN = 0.32;
  var WORD_HOLD = 0.07; // load-bearing, see addDip
  var WORD_UP = 0.42;
  var WORD_STAGGER = 0.08; // between T, H and E
  var WORD_EASE_DOWN = "power2.in";
  var WORD_EASE_UP = "power3.out";

  // Tighter than THE's — eight letters at 0.08 would be 0.56s of stagger alone.
  // These two are the constraint on the opening: CREATIVE's last letter has to
  // be gone before the sheet reaches it, which leaves ~0.2s of slack.
  var BOTTOM_STAGGER = 0.05;
  var BOTTOM_LEAD = 0.06;

  // Beat between the sheet clearing a word and that word rising.
  var WORD_AFTER_SHEET = 0.06;

  var CARD_AT = 0.1; // turns almost on the click, ahead of the colour
  var CARD_TURN = 0.9;
  var CARD_DEPTH = 70; // px it withdraws at the edge-on moment
  var CARD_TILT = 15; // deg it swings off the peg
  var CARD_SETTLE = 1.5; // swing outlasts the turn's half by this much

  /* The showcase pair turns over like the key visual does. They need no cover
     from the colour sheet for the same reason it doesn't — at 90deg there is
     nothing of them left to see. SHOW_LAG is what keeps the two from reading as
     one object: the second is still on its way out as the first comes back. */
  var SHOW_AT = 0.18; // first image, just behind the key visual's turn
  var SHOW_LAG = 0.26; // second image starts this much later
  var SHOW_TURN = 0.78;
  var SHOW_DEPTH = 55; // px each withdraws at the edge-on moment
  var SHOW_PERSPECTIVE = 900;

  var CHIP_OUT = 0.34;
  var CHIP_IN = 0.5;
  var CHIP_STAGGER = 0.07;
  var CHIP_HOLD = 0.06;
  var LEFT_OUT = 0.26; // the paragraph fades rather than slides
  var LEFT_IN = 0.5;
  var LEFT_SHIFT = 18;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var spin = { rot: ACTIVE_ANGLE }; // tweened; index 0 starts in the active slot
  var activeIndex = 0;
  var radius = 0;
  var timeline;
  var wipe;
  var word;
  var bottom;
  var leftTl;
  var cardTl;
  var showTl;

  function measure() {
    radius = track.getBoundingClientRect().width / 2;
  }

  /* Parallax. --parallax is the share of the scroll distance an element gives
     back: positive lags behind the page and reads as further away, negative
     runs ahead of it and reads as nearer. The signs are set to match the
     stacking order — the showcase pair is in front of the key visual, so it
     moves more, not less.

     Driven off GSAP's ticker, which is also driving Lenis, so the offset is
     computed from the same scroll value the page was just laid out with. */
  var section = document.querySelector(".tape-slider-parent");
  var drifters = [];
  var lastScroll = null;

  function collectParallax() {
    drifters = [];
    gsap.utils
      .toArray([".key-visual", ".middle img.showcase"])
      .forEach(function (el) {
        var k = parseFloat(getComputedStyle(el).getPropertyValue("--parallax"));
        if (k) drifters.push({ el: el, k: k });
      });
  }

  function applyParallax() {
    if (!drifters.length) return;
    var y = window.scrollY || window.pageYOffset || 0;
    if (lastScroll !== null && Math.abs(y - lastScroll) < 0.5) return;
    lastScroll = y;
    var rel = y - (section ? section.offsetTop : 0);
    drifters.forEach(function (d) {
      gsap.set(d.el, { y: rel * d.k });
    });
  }

  // Runs on every tick of the spin tween, so rolls travel along the arc rather
  // than cutting straight across it.
  function place() {
    for (var i = 0; i < rolls.length; i++) {
      var a = ((i * STEP + spin.rot) * Math.PI) / 180;
      gsap.set(rolls[i], {
        x: Math.cos(a) * radius,
        y: Math.sin(a) * radius,
      });
    }
  }

  function revealRing(el, delay) {
    gsap.to(el, {
      scale: 1,
      opacity: 1,
      duration: reduced ? 0 : RING_IN,
      delay: reduced ? 0 : delay || 0,
      ease: EASE_OPEN,
      overwrite: "auto",
    });
  }

  // Depth of the arc on the sheet's leading edge, capped so it stays a sweep
  // rather than a deep tongue on tall viewports.
  function arcDepth(box) {
    return Math.min(box.height * 0.22, 240);
  }

  function curve(px) {
    return "0 0 50% 50% / 0 0 " + px + "px " + px + "px";
  }

  /* When the sheet's leading edge has finished passing `el` — i.e. when that
     element may come back on screen in the new colour. The + depth accounts for
     the arc's shallow ends trailing its centre. The ease is scanned rather than
     inverted; power2.out is monotonic so the first sample past the target wins. */
  function sheetClears(el) {
    if (!hasBg || !el) return 0;
    var box = bgOverlay.getBoundingClientRect();
    var depth = arcDepth(box);
    var travel = box.height + depth + 2;
    var need = (el.getBoundingClientRect().bottom - box.top + depth) / travel;
    var ease = gsap.parseEase(BG_EASE);
    for (var i = 0; i <= 100; i++) {
      if (ease(i / 100) >= need) return (i / 100) * BG_REVEAL;
    }
    return BG_REVEAL;
  }

  function paintChip(el, btn) {
    if (!el) return;
    var cs = getComputedStyle(btn);
    el.style.setProperty("--tag-bg", cs.getPropertyValue("--tag-bg").trim());
    el.style.setProperty("--tag-ink", cs.getPropertyValue("--tag-ink").trim());
  }

  function bgOf(btn) {
    return getComputedStyle(btn).getPropertyValue("--bg").trim();
  }

  function wordOf(btn) {
    return getComputedStyle(btn).getPropertyValue("--word").trim();
  }

  // Added straight to the timeline, not built paused and inserted — a child
  // keeps its own paused flag and would never play.
  function addWipe(tl, index, at) {
    var state = { p: 0 };
    var box = null;
    var depth = 0;
    var travel = 0;
    var colour = bgOf(rolls[index]);

    // Also called defensively from onUpdate: GSAP renders a tween once at
    // progress 0 when added to a running timeline, firing onUpdate before
    // onStart.
    function prime() {
      box = bgOverlay.getBoundingClientRect();
      depth = arcDepth(box);

      /* Taller than the stage by the arc depth. The edge has to finish `depth`
         below the stage bottom or the arc's shallow ends leave wedges in the
         corners — and at stage height it would run out of sheet, exposing the
         old colour as a band across the top. */
      travel = box.height + depth + 2;
      bgNext.style.height = travel + "px";
      bgNext.style.background = colour;
      bgNext.style.borderRadius = curve(depth);
      bgNext.style.transform = "translateY(" + -travel + "px)";

      // Same numbers on the repaint layer, so its arc is the sheet's arc.
      if (sweep) {
        sweep.style.height = travel + "px";
        sweep.style.borderRadius = curve(depth);
        sweep.style.transform = "translateY(" + -travel + "px)";
        sweepInner.style.height = box.height + "px";
        sweepInner.style.transform = "translateY(" + travel + "px)";
        paintChip(subheadNext, rolls[index]);
      }
    }

    tl.to(
      state,
      {
        p: 1,
        duration: BG_REVEAL,
        ease: BG_EASE,
        onStart: prime,
        onUpdate: function () {
          if (!box) prime();
          var ty = (state.p - 1) * travel;
          bgNext.style.transform = "translateY(" + ty + "px)";
          if (sweep) {
            // Equal and opposite: the box travels, the copy inside does not.
            sweep.style.transform = "translateY(" + ty + "px)";
            sweepInner.style.transform = "translateY(" + -ty + "px)";
          }
        },
        onComplete: function () {
          bgBase.style.background = colour;
          bgNext.style.transform = "translateY(-100%)";
          // Repaint before parking the copy, or the chip flicks back to the old
          // colour for a frame.
          paintChip(subhead, rolls[index]);
          if (sweep) sweep.style.transform = "translateY(-100%)";
        },
      },
      at
    );

    return tl.recent();
  }

  /* Each letter drops out of the bottom of its own box, recolours out of sight,
     and rises back. `apply` is the only difference between the two words:
     THE moves its own mask, CREATIVE moves the image inside .glyph's overflow
     box — which needs no mask, so it survives the artwork being replaced. */
  function addDip(tl, els, colour, at, stagger, apply, read, returnAt) {
    var sub = gsap.timeline();

    // One hold shared by the whole word. A per-letter hold would have the first
    // letter back up before the last had left, and the sheet is coming.
    var lastDown = (els.length - 1) * stagger + WORD_DOWN;
    var backAt = Math.max(lastDown + WORD_HOLD, (returnAt || 0) - at);

    els.forEach(function (el, i) {
      // offsetHeight, not the bounding rect: CREATIVE's letters sit in wrappers
      // tilted up to 8deg, whose bounding box is taller than the letter.
      var h = el.offsetHeight || el.getBoundingClientRect().height || 1;
      // Start from wherever the letter actually is, not from home. On a fast
      // second click the previous dip is killed mid-flight, and assuming 0 here
      // would snap the letter home for one frame before dropping it again.
      var st = { y: read(el) };
      var move = function () {
        apply(el, st.y);
      };
      var offset = i * stagger;

      sub.to(
        st,
        {
          y: h + 2, // a shade past, so no hairline is left at the box edge
          duration: WORD_DOWN,
          ease: WORD_EASE_DOWN,
          onUpdate: move,
          onComplete: function () {
            // Safe only because of WORD_HOLD: with no pause the up tween renders
            // in the same tick and an ease-out brings ~12% of the letter back
            // into view within one frame.
            el.style.setProperty("--word-colour", colour);
          },
        },
        offset
      );

      sub.to(
        st,
        {
          y: 0,
          duration: WORD_UP,
          ease: WORD_EASE_UP, // no overshoot, or the tops clip at the peak
          onUpdate: move,
        },
        backAt + offset
      );
    });

    tl.add(sub, at);
    return sub;
  }

  function maskDip(el, y) {
    var v = "0px " + y + "px";
    el.style.maskPosition = v;
    el.style.webkitMaskPosition = v;
  }

  function maskAt(el) {
    var m = /([-\d.]+)px\s+([-\d.]+)px/.exec(el.style.maskPosition || "");
    return m ? parseFloat(m[2]) : 0;
  }

  function shiftDip(el, y) {
    gsap.set(el, { y: y });
  }

  function shiftAt(el) {
    return gsap.getProperty(el, "y") || 0;
  }

  function cardOf(btn) {
    return btn.dataset.card || "";
  }

  // Fastest where it is thinnest — power2.in into the edge, power2.out away
  // from it — so the least time is spent edge-on.
  function addCard(tl, index, at) {
    var src = card && cardOf(rolls[index]);
    if (!src) return null;

    var sub = gsap.timeline();
    var half = CARD_TURN / 2;

    sub.to(card, { rotationY: 90, z: -CARD_DEPTH, duration: half, ease: "power2.in" }, 0);
    sub.to(card, { rotation: -CARD_TILT, duration: half, ease: "power2.in" }, 0);

    sub.call(
      function () {
        card.src = src;
        // Jump to the opposite edge-on angle rather than carrying on to 180,
        // where the card faces away and its artwork would read mirrored. Same
        // zero-width silhouette, so the jump is invisible.
        gsap.set(card, { rotationY: -90 });
      },
      null,
      half
    );

    sub.to(
      card,
      {
        rotationY: 0,
        z: 0,
        duration: half,
        ease: "power2.out",
        // Start values must be read after the callback above, or this tweens
        // from 90 back to 0 and undoes the turn.
        immediateRender: false,
      },
      half
    );

    // The swing outlasts the turn, so the card is still settling after it has
    // squared up. That trailing motion is what reads as hanging on a peg.
    sub.to(
      card,
      {
        rotation: 0,
        duration: half * CARD_SETTLE,
        ease: "back.out(2.2)",
        immediateRender: false,
      },
      half
    );

    tl.add(sub, at);
    return sub;
  }

  function showcaseOf(btn) {
    return (btn.dataset.showcase || "").split("|").filter(Boolean);
  }

  // Rotation is reapplied every time because GSAP owns the transform; the CSS
  // only supplies the angle.
  function setShowcase(index) {
    var srcs = showcaseOf(rolls[index]);
    showcase.forEach(function (el, i) {
      if (srcs[i]) el.src = srcs[i];
      gsap.set(el, { rotation: rotOf(el) });
    });
  }

  /* Same turn as the key visual: out to edge-on, swap where there is no width
     to see, then open back out from the opposite edge so the image is never
     mirrored. The resting tilt is left alone — it lives on rotation, the turn
     on rotationY, so the flip axis leans with the card rather than standing
     upright through it. */
  function addShowcase(tl, index, at) {
    var srcs = showcaseOf(rolls[index]);
    if (!showcase.length || !srcs.length) return null;

    var sub = gsap.timeline();
    var half = SHOW_TURN / 2;

    showcase.forEach(function (el, i) {
      var start = i * SHOW_LAG;

      sub.to(
        el,
        { rotationY: 90, z: -SHOW_DEPTH, duration: half, ease: "power2.in" },
        start
      );

      sub.call(
        function () {
          if (srcs[i]) el.src = srcs[i];
          gsap.set(el, { rotationY: -90 });
        },
        null,
        start + half
      );

      sub.to(
        el,
        {
          rotationY: 0,
          z: 0,
          duration: half,
          ease: "power2.out",
          immediateRender: false, // start value must be read after the callback
        },
        start + half
      );
    });

    tl.add(sub, at);
    return sub;
  }

  function labelsOf(btn) {
    return (btn.dataset.tags || "").split("|").filter(Boolean);
  }

  // A fixed pool, built once. Rebuilding per swap would destroy the elements
  // the exit animation is mid-way through moving. Tapes with fewer labels hide
  // the spares.
  function buildChips() {
    if (!tagBox) return;
    var most = rolls.reduce(function (m, b) {
      return Math.max(m, labelsOf(b).length);
    }, 0);
    tagBox.textContent = "";
    for (var i = 0; i < most; i++) {
      var h = document.createElement("h6");
      h.className = "h6";
      tagBox.appendChild(h);
      chips.push(h);
    }
  }

  function rotOf(el) {
    return parseFloat(getComputedStyle(el).getPropertyValue("--rot")) || 0;
  }

  // Called at the point in the timeline where the column is off screen, so none
  // of this is seen changing.
  function fillLeft(index) {
    if (!left) return;
    var btn = rolls[index];
    var cs = getComputedStyle(btn);

    ["--tag-bg", "--tag-ink", "--ink"].forEach(function (name) {
      left.style.setProperty(name, cs.getPropertyValue(name).trim());
    });

    var labels = labelsOf(btn);
    chips.forEach(function (c, i) {
      var used = i < labels.length;
      c.textContent = used ? labels[i] : "";
      c.style.display = used ? "" : "none";
      // Rotation only — passing x would undo the exit and snap the chip back on
      // screen mid-swap.
      gsap.set(c, { rotation: rotOf(c) });
    });

    if (copyBox) copyBox.textContent = btn.dataset.copy || "";
  }

  /* Chips leave to the left one after another, swap while all off screen, then
     return in the same order. One shared exit distance measured off the column's
     right edge, so even the widest chip clears. returnAt is the earliest the
     chips may come back, on the parent timeline's clock. */
  function addLeft(tl, index, at, returnAt) {
    if (!left || !chips.length) return null;

    var sub = gsap.timeline();
    var outX = -(left.getBoundingClientRect().right + 40);
    var lastOut = (chips.length - 1) * CHIP_STAGGER + CHIP_OUT;
    // Floored, so the gate can only delay the return, never pull it into the exit.
    var backAt = Math.max(lastOut + CHIP_HOLD, (returnAt || 0) - at);

    chips.forEach(function (c, i) {
      sub.to(c, { x: outX, duration: CHIP_OUT, ease: "power2.in" }, i * CHIP_STAGGER);
    });
    if (copyBox) {
      sub.to(
        copyBox,
        { opacity: 0, y: LEFT_SHIFT, duration: LEFT_OUT, ease: "power2.in" },
        0
      );
    }

    sub.call(
      function () {
        fillLeft(index);
      },
      null,
      lastOut
    );

    chips.forEach(function (c, i) {
      sub.to(
        c,
        { x: 0, duration: CHIP_IN, ease: "power3.out" },
        backAt + i * CHIP_STAGGER
      );
    });
    if (copyBox) {
      sub.to(
        copyBox,
        { opacity: 1, y: 0, duration: LEFT_IN, ease: "power3.out" },
        backAt
      );
    }

    tl.add(sub, at);
    return sub;
  }

  function markState() {
    rolls.forEach(function (btn, i) {
      var on = i === activeIndex;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
      gsap.set(btn, { zIndex: on ? 2 : 1 });
    });
  }

  function goTo(index) {
    if (index === activeIndex) return;
    activeIndex = index;

    // Land on the nearest equivalent angle, so the ring takes the short way
    // round instead of unwinding 270deg.
    var target = ACTIVE_ANGLE - index * STEP;
    var delta = ((((target - spin.rot) % 360) + 540) % 360) - 180;

    /* Run mid-flight work to its end, because killing it would strand the sheet
       half-drawn with the old colour still on the base, the chips off screen and
       the card edge-on.

       The dips and the left column are the exception. Completing them puts the
       letters and chips back home — visibly, since both are on screen for most
       of their travel — only to send them straight out again. They are left
       where they are instead: addDip reads the letter's position as its start,
       and the chips' tweens pick theirs up for free, because a .to() reads its
       start value when it first renders rather than when it is authored.

       fillLeft is not lost by skipping the completion — the incoming addLeft
       schedules its own. */
    if (wipe && wipe.isActive()) wipe.progress(1);
    // The turns are completed rather than left: abandoning one mid-flight would
    // have the next turn reverse direction from wherever it stopped.
    if (cardTl && cardTl.isActive()) cardTl.progress(1);
    if (showTl && showTl.isActive()) showTl.progress(1);

    // Killing leaves spin.rot where it stopped, which is what delta was measured
    // against — so an interrupted selection re-aims instead of snapping.
    if (timeline) timeline.kill();
    markState();

    if (reduced) {
      gsap.set(rings, { scale: 0, opacity: 0 });
      spin.rot += delta;
      place();
      revealRing(rings[index]);
      if (hasBg) bgBase.style.background = bgOf(rolls[index]);
      // Per letter, not on :root — the dip writes an inline --word-colour that
      // would win over anything set here.
      var wc = wordOf(rolls[index]);
      letters.forEach(function (el) {
        el.style.setProperty("--word-colour", wc);
      });
      glyphs.forEach(function (el) {
        el.style.setProperty("--word-colour", wc);
        gsap.set(el, { y: 0 });
      });
      if (card && cardOf(rolls[index])) {
        card.src = cardOf(rolls[index]);
        gsap.set(card, { rotationY: 0, rotation: 0, z: 0 });
      }
      setShowcase(index);
      gsap.set(showcase, { rotationY: 0, z: 0 });
      paintChip(subhead, rolls[index]);
      fillLeft(index);
      return dispatch(index);
    }

    // Absolute seconds rather than "+=" offsets: the schedule deliberately
    // overlaps, and relative offsets make that very hard to read back.
    var atTravel = RING_OUT - CLOSE_OVERLAP;
    var atOpen = atTravel + TRAVEL - OPEN_LEAD;

    timeline = gsap.timeline();

    timeline
      .to(
        rings,
        {
          scale: 0,
          opacity: 0,
          duration: RING_OUT,
          ease: EASE_CLOSE,
        },
        0
      )
      .to(
        spin,
        {
          rot: spin.rot + delta,
          duration: TRAVEL,
          ease: EASE,
          onUpdate: place,
        },
        atTravel
      )
      .to(
        rings[index],
        {
          scale: 1,
          opacity: 1,
          duration: RING_IN,
          ease: EASE_OPEN,
        },
        atOpen
      );

    var wordColour = wordOf(rolls[index]);

    if (hasBg) wipe = addWipe(timeline, index, atOpen);

    // Both words drop on the click and are gone before the sheet is released.
    // Each returns the moment the sheet has finished passing it, so they come
    // back in the sheet's own direction — THE first, then CREATIVE.
    if (letters.length)
      word = addDip(
        timeline,
        letters,
        wordColour,
        0,
        WORD_STAGGER,
        maskDip,
        maskAt,
        atOpen + sheetClears(topWord) + WORD_AFTER_SHEET
      );
    if (glyphs.length)
      bottom = addDip(
        timeline,
        glyphs,
        wordColour,
        BOTTOM_LEAD,
        BOTTOM_STAGGER,
        shiftDip,
        shiftAt,
        atOpen + sheetClears(bottomWord) + WORD_AFTER_SHEET
      );
    cardTl = addCard(timeline, index, CARD_AT);

    showTl = addShowcase(timeline, index, SHOW_AT);
    // Exit with the orbit; return gated on the sheet landing. With no background
    // there is nothing to wait for, so the chips fall back to their own beat.
    leftTl = addLeft(
      timeline,
      index,
      atTravel,
      hasBg ? atOpen + BG_REVEAL : 0
    );

    dispatch(index);
  }

  function dispatch(index) {
    track.dispatchEvent(
      new CustomEvent("roll:change", {
        bubbles: true,
        detail: { index: index, id: rolls[index].dataset.index },
      })
    );
  }

  rolls.forEach(function (btn, i) {
    gsap.set(btn, { xPercent: -50, yPercent: -50 });
    btn.addEventListener("click", function () {
      goTo(i);
    });
  });

  track.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    var next =
      (activeIndex + (e.key === "ArrowRight" ? 1 : -1) + rolls.length) %
      rolls.length;
    goTo(next);
    rolls[next].focus();
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measure();
      place();
      lastScroll = null; // offsetTop may have moved, so force a recompute
      applyParallax();
    }, 120);
  });

  measure();
  gsap.set(rings, { scale: 0, opacity: 0 });
  place();
  markState();
  // Seed the stage so the first paint is correct rather than flashing the CSS
  // default.
  if (hasBg) {
    bgBase.style.background = bgOf(rolls[activeIndex]);
    root.style.setProperty("--word-colour", wordOf(rolls[activeIndex]));
  }
  /* Decode every card up front — the src swaps on the single frame the turn is
     edge-on, and an undecoded image draws nothing. The elements are retained
     rather than discarded: a bare `new Image().src` is collectable the moment it
     leaves scope, taking the decoded bitmap with it. */
  var preloaded = rolls
    .reduce(function (list, b) {
      return list.concat(cardOf(b) || [], showcaseOf(b));
    }, [])
    .filter(Boolean)
    .map(function (src) {
      var img = new Image();
      img.src = src;
      if (img.decode) img.decode().catch(function () {});
      return img;
    });
  if (card && cardOf(rolls[activeIndex])) card.src = cardOf(rolls[activeIndex]);

  // Perspective on the elements themselves, not a shared parent — the key
  // visual already has its own and the two want independent vanishing points.
  gsap.set(showcase, { transformPerspective: SHOW_PERSPECTIVE });
  setShowcase(activeIndex);
  collectParallax();
  applyParallax();
  gsap.ticker.add(applyParallax);
  paintChip(subhead, rolls[activeIndex]);
  buildChips();
  fillLeft(activeIndex);
  track.classList.add("is-ready");
  // On load the rolls are already placed, so the opening ring waits only for the
  // track's fade-in.
  revealRing(rings[activeIndex], 0.4);
})();
