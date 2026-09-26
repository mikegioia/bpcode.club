// Color Picker lab
//
// The color lives in one place: `state` (hue, saturation, value). Every
// control changes that state and then calls render(), which repaints
// the whole page. That way the wheel, the sliders, the dropdown and the
// hex readout always agree with each other.

(function () {
  "use strict";

  // --- Elements -----------------------------------------------------------

  const wheel = document.getElementById("wheel");
  const svSquare = document.getElementById("sv-square");
  const hueMarker = document.getElementById("hue-marker");
  const svMarker = document.getElementById("sv-marker");
  const swatch = document.getElementById("swatch");
  const hexValue = document.getElementById("hex-value");
  const nameValue = document.getElementById("name-value");
  const namedSelect = document.getElementById("named-color");

  const channels = ["r", "g", "b"].map(function (id) {
    return {
      range: document.getElementById(id),
      hex: document.getElementById(id + "-hex"),
    };
  });

  // Wheel geometry. Keep in sync with .sv-square in style.css.
  const INNER = 0.78; // inner radius of the hue ring, as a fraction of the outer radius
  const SQUARE = INNER * Math.SQRT1_2 * 0.94; // half-side of the square, as a fraction of the outer radius

  // --- State --------------------------------------------------------------

  const state = { h: 0, s: 0, v: 0 }; // filled in by setRgb() at start

  // --- Conversions --------------------------------------------------------

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function toHex2(n) {
    return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  }

  function rgbToHex(r, g, b) {
    return "#" + toHex2(r) + toHex2(g) + toHex2(b);
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  // h in degrees 0-360, s and v in 0-1 -> [r, g, b] each 0-255
  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rgb;
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return rgb.map(function (n) {
      return Math.round((n + m) * 255);
    });
  }

  // r, g, b each 0-255 -> { h, s, v }. Hue is null for grays.
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = null;
    if (d > 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
      if (h < 0) h += 360;
    }
    return { h: h, s: max === 0 ? 0 : d / max, v: max };
  }

  // --- Named colors -------------------------------------------------------

  const nameByHex = new Map();
  NAMED_COLORS.forEach(function (entry) {
    if (!nameByHex.has(entry[1])) nameByHex.set(entry[1], entry[0]);
  });

  function fillDropdown() {
    NAMED_COLORS.forEach(function (entry) {
      const option = document.createElement("option");
      option.value = entry[1];
      option.textContent = entry[0];
      namedSelect.appendChild(option);
    });
  }

  // --- Changing the color ---------------------------------------------------

  function setHsv(h, s, v) {
    state.h = ((h % 360) + 360) % 360;
    state.s = clamp(s, 0, 1);
    state.v = clamp(v, 0, 1);
    render();
  }

  function setRgb(r, g, b) {
    const hsv = rgbToHsv(r, g, b);
    // A gray has no hue of its own, so keep the wheel where it was.
    if (hsv.h !== null) state.h = hsv.h;
    state.s = hsv.s;
    state.v = hsv.v;
    render();
  }

  function setHex(hex) {
    const rgb = hexToRgb(hex);
    setRgb(rgb[0], rgb[1], rgb[2]);
  }

  // --- Painting the page ----------------------------------------------------

  function render() {
    const rgb = hsvToRgb(state.h, state.s, state.v);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

    swatch.style.backgroundColor = hex;
    hexValue.textContent = hex.toUpperCase();

    channels.forEach(function (ch, i) {
      ch.range.value = rgb[i];
      if (document.activeElement !== ch.hex) {
        ch.hex.value = toHex2(rgb[i]).toUpperCase();
      }
    });

    // Wheel: tint the square with the current hue and place both markers.
    svSquare.style.setProperty("--hue", state.h.toFixed(1));
    const ringR = (1 + INNER) / 2; // middle of the ring band
    const rad = (state.h * Math.PI) / 180;
    hueMarker.style.left = 50 + 50 * ringR * Math.sin(rad) + "%";
    hueMarker.style.top = 50 - 50 * ringR * Math.cos(rad) + "%";
    svMarker.style.left = state.s * 100 + "%";
    svMarker.style.top = (1 - state.v) * 100 + "%";
    hueMarker.style.setProperty("--c", "hsl(" + state.h.toFixed(1) + ", 100%, 50%)");
    svMarker.style.setProperty("--c", hex);

    // Name and dropdown
    const name = nameByHex.get(hex);
    if (name) {
      if (namedSelect.value !== hex) namedSelect.value = hex;
      nameValue.textContent = namedSelect.options[namedSelect.selectedIndex].textContent;
      nameValue.classList.remove("none");
    } else {
      nameValue.textContent = "no name for this color";
      nameValue.classList.add("none");
      namedSelect.value = "";
    }
  }

  // --- The wheel ------------------------------------------------------------

  let dragMode = null; // "hue" or "sv" while the pointer is held down

  function wheelPoint(event) {
    const rect = wheel.getBoundingClientRect();
    const R = rect.width / 2;
    return {
      x: (event.clientX - rect.left - R) / R, // -1 .. 1, right is positive
      y: (event.clientY - rect.top - R) / R, // -1 .. 1, down is positive
    };
  }

  function applyHue(p) {
    let deg = (Math.atan2(p.x, -p.y) * 180) / Math.PI; // 0 at top, clockwise
    if (deg < 0) deg += 360;
    setHsv(deg, state.s, state.v);
  }

  function applySv(p) {
    const s = (p.x + SQUARE) / (2 * SQUARE);
    const v = 1 - (p.y + SQUARE) / (2 * SQUARE);
    setHsv(state.h, s, v);
  }

  wheel.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    const p = wheelPoint(event);
    const dist = Math.hypot(p.x, p.y);
    const inSquare = Math.abs(p.x) <= SQUARE && Math.abs(p.y) <= SQUARE;

    if (inSquare) dragMode = "sv";
    else if (dist <= 1.02) dragMode = "hue";
    else return;

    wheel.setPointerCapture(event.pointerId);
    wheel.classList.add("dragging");
    event.preventDefault();
    if (dragMode === "hue") applyHue(p);
    else applySv(p);
  });

  wheel.addEventListener("pointermove", function (event) {
    if (!dragMode) return;
    const p = wheelPoint(event);
    if (dragMode === "hue") applyHue(p);
    else applySv(p);
  });

  function endDrag() {
    dragMode = null;
    wheel.classList.remove("dragging");
  }
  wheel.addEventListener("pointerup", endDrag);
  wheel.addEventListener("pointercancel", endDrag);

  // --- Sliders and hex boxes ------------------------------------------------

  function rgbFromRanges() {
    return channels.map(function (ch) {
      return Number(ch.range.value);
    });
  }

  channels.forEach(function (ch, i) {
    ch.range.addEventListener("input", function () {
      const rgb = rgbFromRanges();
      setRgb(rgb[0], rgb[1], rgb[2]);
    });

    ch.hex.addEventListener("input", function () {
      const text = ch.hex.value.trim();
      if (!/^[0-9a-fA-F]{1,2}$/.test(text)) return; // wait until it's valid hex
      const rgb = rgbFromRanges();
      rgb[i] = parseInt(text, 16);
      setRgb(rgb[0], rgb[1], rgb[2]);
    });

    // When they leave the box, show the real value in tidy 2-digit form.
    ch.hex.addEventListener("blur", function () {
      ch.hex.value = toHex2(Number(ch.range.value)).toUpperCase();
    });

    ch.hex.addEventListener("focus", function () {
      ch.hex.select();
    });
  });

  // --- Dropdown -------------------------------------------------------------

  namedSelect.addEventListener("change", function () {
    if (namedSelect.value) setHex(namedSelect.value);
  });

  // --- Copy button ----------------------------------------------------------

  const copyButton = document.getElementById("copy-hex");
  copyButton.addEventListener("click", function () {
    const done = function () {
      copyButton.textContent = "Copied!";
      copyButton.classList.add("copied");
      setTimeout(function () {
        copyButton.textContent = "Copy";
        copyButton.classList.remove("copied");
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hexValue.textContent).then(done, done);
    } else {
      done();
    }
  });

  // --- Start ----------------------------------------------------------------

  fillDropdown();
  setHex("#2457ff");
})();
