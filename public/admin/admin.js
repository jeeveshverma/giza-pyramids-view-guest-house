/* Giza Pyramids View Guest House — website dashboard (no dependencies).
   Edits src/data/content.json and the photos in src/assets/photos/, and commits them to GitHub.
   The "Publish" workflow in .github/workflows/ then rebuilds and deploys the site.
   The Bookings section talks to the booking backend (worker/): it shows and changes bookings at
   once, with no Publish step. It signs in there with the same access key. */
(function () {
  "use strict";

  var REPO = "jeeveshverma/giza-pyramids-view-guest-house";
  var BRANCH = new URLSearchParams(location.search).get("branch") || "main";
  var API = "https://api.github.com/repos/" + REPO;
  var CONTENT_PATH = "src/data/content.json";
  var PHOTO_DIR = "src/assets/photos/";
  var SITE = "../";
  var KEY = "gizapv.admin.key";
  // The booking backend. "?api=" may point at a copy running on this computer, for testing only.
  var BOOK = "https://api.gizapyramidsviewguesthouse.com";
  var apiParam = new URLSearchParams(location.search).get("api");
  if (apiParam && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(apiParam)) BOOK = apiParam;
  var SOURCES = [["whatsapp", "WhatsApp"], ["phone", "Phone"], ["walk-in", "Walk-in"], ["booking.com", "Booking.com"], ["other", "Other"]];
  var TABS = [["bookings", "Bookings"], ["rooms", "Rooms and prices"], ["contact", "Phone and WhatsApp"], ["scores", "Review scores"], ["reviews", "Guest reviews"], ["photos", "Photos"]];
  // The room types, in the order the site lists them (the same list as src/data/content.ts).
  var ROOMS = [["twin-view", "Twin room, pyramids view"], ["studio", "Deluxe studio"], ["triple", "Triple room"], ["twin", "Twin room"], ["double", "Double room"]];
  var SCORES = [["google", "Google", 5], ["tripadvisor", "Tripadvisor", 5], ["trip", "Trip.com", 10]];
  var PHONE = /^\+\d[\d ]{7,18}\d$/;

  var app = document.getElementById("app");
  var S = {
    token: null, saved: null, draft: null, sha: null, updated: null,
    slots: [], photos: new Map(), shown: {}, tab: "bookings", busy: false, status: null, errors: [],
    bk: { list: null, cal: null, today: null, calFrom: null, range: "next", loading: false, error: null, form: null, formError: null, sure: null, acting: null, showCancelled: false }
  };

  /* ---------------------------------------------------------------- helpers */
  function h(tag, props) {
    var el = document.createElement(tag), k, v;
    for (k in props || {}) {
      v = props[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (x) { add(el, x); });
    else el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function oneLine(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  function gh(path, opts) {
    opts = opts || {};
    var headers = { Accept: "application/vnd.github+json", Authorization: "Bearer " + S.token, "X-GitHub-Api-Version": "2022-11-28" };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(API + path, { method: opts.method || "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store" })
      .then(function (res) {
        if (res.ok) return res.status === 204 ? null : res.json();
        return res.json().catch(function () { return {}; }).then(function (j) {
          var e = new Error(j.message || "GitHub answered " + res.status);
          e.status = res.status;
          e.write = !!opts.method && opts.method !== "GET";
          throw e;
        });
      });
  }
  function explain(e) {
    if (e.friendly) return e.message;
    if (e.status === 401) return "The access key behind this login has expired. Please tell Jeevesh.";
    if (e.write && (e.status === 403 || e.status === 404)) return "This access key can open the dashboard but is not allowed to publish. Ask Jeevesh for a new key.";
    if (e.status === 409 || e.status === 422) return "Someone else published at the same moment. Reload the page and try again.";
    if (e.status === 403 || e.status === 429) return "GitHub is asking us to slow down. Wait a minute and try again.";
    if (e.status === 404) return "The website's files could not be found with this access key. Ask Jeevesh to check the key.";
    if (e instanceof TypeError) return "No internet connection, or GitHub could not be reached. Check your connection and try again.";
    return "Something went wrong: " + e.message;
  }
  function friendly(msg) { var e = new Error(msg); e.friendly = true; return e; }

  function b64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1]); };
      r.onerror = function () { rej(friendly("The photo could not be read from your device.")); };
      r.readAsDataURL(blob);
    });
  }
  function fromB64(s) {
    var bin = atob(s.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------------------------------------------------------------- loading */
  function loadContent() {
    return gh("/contents/" + CONTENT_PATH + "?ref=" + encodeURIComponent(BRANCH)).then(function (f) {
      var c = JSON.parse(fromB64(f.content));
      S.sha = f.sha;
      S.updated = c.updated || null;
      delete c.updated;
      S.saved = c;
      S.draft = clone(c);
    });
  }

  // The photos the site uses, with the size of each, listed by the site itself when it is built
  // (src/pages/admin/photos.json.ts). A new photo keeps the size of the one it replaces.
  function loadSlots() {
    return fetch("photos.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw friendly("The list of the website's photos could not be loaded.");
      return r.json();
    }).then(function (list) {
      S.slots = list.map(function (p) {
        return { path: PHOTO_DIR + p.id + ".jpg", w: p.w, h: p.h, thumb: p.thumb, group: p.group, label: p.label, alt: p.alt };
      });
    });
  }

  /* ---------------------------------------------------------------- checks (the same rules as src/data/content.ts) */
  function normalise(c) {
    c.contact.phone = oneLine(c.contact.phone);
    c.contact.whatsapp = oneLine(c.contact.whatsapp);
    SCORES.forEach(function (s) { c.scores[s[0]].score = oneLine(c.scores[s[0]].score).replace(",", "."); });
    c.reviews.forEach(function (r) { r.name = oneLine(r.name); r.text = oneLine(r.text); r.when.en = oneLine(r.when.en); r.when.ar = oneLine(r.when.ar); });
    return c;
  }
  function whole(v, min, max) { return Number.isInteger(v) && v >= min && v <= max; }
  function validate(c) {
    var errs = [];
    function err(tab, msg) { errs.push({ tab: tab, msg: msg }); }
    c.rooms.forEach(function (r, i) {
      var name = ROOMS[i][1];
      if (r.price !== null && !whole(r.price, 1, 9999)) err("rooms", name + ": the price must be a whole number of dollars, or left empty.");
      if (!whole(r.count, 1, 9)) err("rooms", name + ": the number of rooms must be from 1 to 9.");
    });
    [["phone", "Phone number"], ["whatsapp", "WhatsApp number"]].forEach(function (k) {
      if (!PHONE.test(c.contact[k[0]])) err("contact", k[1] + ": write it with the country code, like +20 100 536 2094.");
    });
    SCORES.forEach(function (s) {
      var v = c.scores[s[0]];
      if (!/^\d{1,2}(\.\d)?$/.test(v.score) || parseFloat(v.score) > s[2]) err("scores", s[1] + ": enter a score out of " + s[2] + ", such as " + (s[2] === 5 ? "4.5" : "8.6") + ".");
      if (!whole(v.count, 1, 999999)) err("scores", s[1] + ": the number of reviews must be a whole number.");
    });
    if (!c.reviews.length) err("reviews", "Keep at least one review.");
    c.reviews.forEach(function (r, i) {
      var n = "Review " + (i + 1);
      if (!r.text) err("reviews", n + ": add the guest's words.");
      if (!r.when.en) err("reviews", n + ": add where and when it was written, in English.");
      if (!r.when.ar) err("reviews", n + ": add where and when it was written, in Arabic.");
    });
    return errs;
  }

  /* ---------------------------------------------------------------- what changed */
  function changes() {
    var out = [], d = S.draft, s = S.saved;
    if (!same(d.rooms, s.rooms)) out.push("rooms and prices");
    if (!same(d.contact, s.contact)) out.push("phone and WhatsApp");
    if (!same(d.scores, s.scores)) out.push("review scores");
    if (!same(d.reviews, s.reviews)) out.push("guest reviews");
    if (S.photos.size) out.push(plural(S.photos.size, "photo"));
    return out;
  }
  function dirty() { return !!S.draft && changes().length > 0; }
  window.addEventListener("beforeunload", function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------------------------------------------------------------- photos */
  function decode(file) {
    var viaTag = function () {
      return new Promise(function (res, rej) {
        var img = new Image(), u = URL.createObjectURL(file);
        img.onload = function () { URL.revokeObjectURL(u); res(img); };
        img.onerror = function () { URL.revokeObjectURL(u); rej(friendly("This file could not be opened as a photo. Try a JPG or PNG.")); };
        img.src = u;
      });
    };
    if (!window.createImageBitmap) return viaTag();
    return createImageBitmap(file, { imageOrientation: "from-image" }).catch(viaTag);
  }
  // Fill w × h from the middle of the photo, the way the page itself crops it.
  function cover(src, w, ht) {
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    var scale = Math.max(w / sw, ht / sh), cw = w / scale, ch = ht / scale;
    var c = document.createElement("canvas");
    c.width = w; c.height = ht;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, ht);
    return new Promise(function (res, rej) {
      c.toBlob(function (b) { b ? res(b) : rej(friendly("The photo could not be prepared on this device.")); }, "image/jpeg", 0.85);
    });
  }
  function choosePhoto(slot, file) {
    if (!file) return;
    S.status = null;
    decode(file).then(function (src) {
      var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
      return cover(src, slot.w, slot.h).then(function (blob) {
        var old = S.photos.get(slot.path);
        if (old) URL.revokeObjectURL(old.url);
        S.photos.set(slot.path, {
          full: blob, url: URL.createObjectURL(blob),
          blurry: sw < slot.w || sh < slot.h ? sw + " × " + sh : null
        });
        if (src.close) src.close();
        render();
      });
    }).catch(function (e) { S.status = { kind: "bad", text: explain(e) }; render(); });
  }
  function undoPhoto(slot) {
    var p = S.photos.get(slot.path);
    if (p) URL.revokeObjectURL(p.url);
    S.photos.delete(slot.path);
    render();
  }

  /* ---------------------------------------------------------------- publish */
  function publish() {
    if (S.busy) return;
    normalise(S.draft);
    S.errors = validate(S.draft);
    if (S.errors.length) {
      S.tab = S.errors[0].tab;
      S.status = null;
      render();
      window.scrollTo(0, 0);
      return;
    }
    var what = changes(), stamp = new Date().toISOString(), head, commitSha;
    var content = Object.assign({}, S.draft, { updated: stamp });
    S.busy = true;
    S.status = { kind: "work", text: "Saving your changes…" };
    render();

    gh("/git/ref/heads/" + encodeURIComponent(BRANCH)).then(function (ref) {
      head = ref.object.sha;
      return gh("/contents/" + CONTENT_PATH + "?ref=" + head);
    }).then(function (cur) {
      if (cur.sha !== S.sha) throw friendly("The website was changed somewhere else since you opened this page. Reload the page to see the latest version, then make your changes again.");
      return gh("/git/commits/" + head);
    }).then(function (commit) {
      var tree = [{ path: CONTENT_PATH, mode: "100644", type: "blob", content: JSON.stringify(content, null, 1) + "\n" }];
      var files = [];
      S.photos.forEach(function (p, path) { files.push([path, p.full]); });
      var chain = Promise.resolve();
      files.forEach(function (f, i) {
        chain = chain.then(function () {
          S.status = { kind: "work", text: "Uploading photo " + (i + 1) + " of " + files.length + "…" };
          render();
          return b64(f[1]);
        }).then(function (data) {
          return gh("/git/blobs", { method: "POST", body: { content: data, encoding: "base64" } });
        }).then(function (blob) {
          tree.push({ path: f[0], mode: "100644", type: "blob", sha: blob.sha });
        });
      });
      return chain.then(function () {
        S.status = { kind: "work", text: "Saving your changes…" };
        render();
        return gh("/git/trees", { method: "POST", body: { base_tree: commit.tree.sha, tree: tree } });
      });
    }).then(function (tree) {
      return gh("/git/commits", { method: "POST", body: { message: "Dashboard: " + what.join(", "), tree: tree.sha, parents: [head] } });
    }).then(function (commit) {
      commitSha = commit.sha;
      return gh("/git/refs/heads/" + encodeURIComponent(BRANCH), { method: "PATCH", body: { sha: commitSha } });
    }).then(function () {
      return gh("/contents/" + CONTENT_PATH + "?ref=" + commitSha);
    }).then(function (f) {
      S.sha = f.sha;
      S.saved = clone(S.draft);
      S.updated = stamp;
      S.photos.forEach(function (p, path) { S.shown[path] = p.url; });
      S.photos.clear();
      S.busy = false;
      S.status = { kind: "work", text: "Saved. Now updating the website. This takes a minute or two…" };
      render();
      watch(stamp, commitSha);
    }).catch(function (e) {
      S.busy = false;
      S.status = { kind: "bad", text: explain(e) + " Nothing was published." };
      render();
    });
  }

  // Wait until the live site serves the version just saved. Also ask GitHub whether the
  // build failed, so a failure is shown instead of waiting for nothing.
  function watch(stamp, commitSha) {
    var started = Date.now(), tries = 0;
    function done(kind, text, link) {
      if (S.updated !== stamp) return; // a newer publish has taken over
      S.status = { kind: kind, text: text, link: link };
      render();
    }
    function tick() {
      if (S.updated !== stamp) return;
      tries++;
      fetch("content.json?v=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (live) {
        if (live.updated === stamp) return done("good", "Your changes are live on the website.", true);
        var failed = tries % 3 ? Promise.resolve(false) : gh("/actions/runs?per_page=5&head_sha=" + commitSha).then(function (j) {
          return (j.workflow_runs || []).some(function (run) { return run.conclusion === "failure" || run.conclusion === "cancelled" || run.conclusion === "timed_out"; });
        }).catch(function () { return false; });
        return failed.then(function (bad) {
          if (bad) return done("bad", "Your changes are saved, but the website could not be rebuilt, so visitors still see the old version. Please tell Jeevesh.");
          if (Date.now() - started > 12 * 60000) return done("warn", "Your changes are saved, but the website is taking longer than usual to update. Check the site in a few minutes, and tell Jeevesh if it still shows the old version.", true);
          setTimeout(tick, 5000);
        });
      });
    }
    setTimeout(tick, 30000);
  }

  function discard() {
    S.draft = clone(S.saved);
    S.photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
    S.photos.clear();
    S.errors = [];
    S.status = null;
    render();
  }

  /* ---------------------------------------------------------------- views */
  function field(label, input, hint) {
    return h("label", { class: "field" }, h("span", { class: "lbl", text: label }), input, hint ? h("span", { class: "hint", text: hint }) : null);
  }
  function numberInput(value, onChange, opts) {
    opts = opts || {};
    return h("input", {
      type: "text", inputmode: "numeric", class: "num" + (opts.cls ? " " + opts.cls : ""), placeholder: opts.placeholder, value: value == null ? "" : String(value), maxlength: opts.max || 4,
      "aria-label": opts.label,
      oninput: function (e) {
        var raw = e.target.value.trim();
        // What is not a number is kept as typed, so it counts as a change and the check before publishing names it.
        onChange(/^\d+$/.test(raw) ? parseInt(raw, 10) : raw === "" && opts.blank !== undefined ? opts.blank : raw);
        bar();
      }
    });
  }
  function textInput(value, onChange, opts) {
    opts = opts || {};
    return h(opts.rows ? "textarea" : "input", {
      type: opts.rows ? null : "text", value: value || "", rows: opts.rows, dir: opts.auto ? "auto" : opts.ar ? "rtl" : "ltr", lang: opts.auto ? null : opts.ar ? "ar" : "en",
      class: opts.ar ? "ar" : null, placeholder: opts.placeholder, "aria-label": opts.label,
      oninput: function (e) { onChange(e.target.value); bar(); }
    });
  }
  function move(list, i, by) {
    var j = i + by;
    if (j < 0 || j >= list.length) return;
    list.splice(j, 0, list.splice(i, 1)[0]);
    render();
  }
  function rowTools(list, i, name) {
    return h("div", { class: "tools" },
      h("button", { type: "button", class: "icon", disabled: i === 0, "aria-label": "Move " + name + " up", onclick: function () { move(list, i, -1); } }, "↑"),
      h("button", { type: "button", class: "icon", disabled: i === list.length - 1, "aria-label": "Move " + name + " down", onclick: function () { move(list, i, 1); } }, "↓"),
      h("button", { type: "button", class: "icon del", "aria-label": "Remove " + name, onclick: function () { list.splice(i, 1); render(); } }, "×"));
  }

  function viewRooms() {
    return h("section", null,
      h("p", { class: "intro", text: "The price for one night in each kind of room, and how many of them the house has. Leave a price empty and the website shows “On request”." }),
      h("div", { class: "card" }, S.draft.rooms.map(function (r, i) {
        var name = ROOMS[i][1];
        return h("div", { class: "line room" },
          h("span", { class: "name", text: name }),
          h("label", { class: "pair" }, h("span", { class: "lbl", text: "Price a night" }),
            h("span", { class: "money" }, h("span", { class: "unit", text: "US$" }),
              numberInput(r.price, function (v) { r.price = v; }, { label: name + ", price a night in US dollars", blank: null, placeholder: "—" }))),
          h("label", { class: "pair" }, h("span", { class: "lbl", text: "Rooms" }),
            numberInput(r.count, function (v) { r.count = v; }, { label: name + ", number of rooms", max: 1, cls: "count" })));
      })),
      h("p", { class: "note", text: "A price is shown as “US$45, per night, paid at the house”. The website never takes payment. The number of rooms is also how many the website will let guests book for the same night." }));
  }

  function viewContact() {
    var c = S.draft.contact;
    function phone(key, label, hint) {
      return field(label, h("input", { type: "text", inputmode: "tel", class: "phone", dir: "ltr", maxlength: 22, value: c[key], oninput: function (e) { c[key] = e.target.value; bar(); } }), hint);
    }
    return h("section", null,
      h("p", { class: "intro", text: "Write each number with the country code, starting with +, like +20 100 536 2094." }),
      h("div", { class: "card contact" },
        phone("whatsapp", "WhatsApp number", "Every booking request and every WhatsApp button on the website opens a chat with this number."),
        phone("phone", "Phone number", "Shown at the top and bottom of every page for calls.")));
  }

  function viewScores() {
    var sc = S.draft.scores;
    return h("section", null,
      h("p", { class: "intro", text: "Copy these from your Google, Tripadvisor and Trip.com pages when they change." }),
      h("div", { class: "card" }, SCORES.map(function (s) {
        var v = sc[s[0]];
        return h("div", { class: "line score" },
          h("span", { class: "name" }, s[1], h("small", { text: "Score out of " + s[2] })),
          h("label", { class: "pair" }, h("span", { class: "lbl", text: "Score" }),
            h("input", { type: "text", inputmode: "decimal", class: "num", maxlength: 4, value: v.score, "aria-label": s[1] + " score", oninput: function (e) { v.score = e.target.value; bar(); } })),
          h("label", { class: "pair" }, h("span", { class: "lbl", text: "Reviews" }),
            numberInput(v.count, function (n) { v.count = n; }, { max: 6, label: s[1] + ", number of reviews" })));
      })));
  }

  function viewReviews() {
    var list = S.draft.reviews;
    return h("section", null,
      h("p", { class: "intro", text: "The guests' words that turn over one at a time on the home page. Copy them exactly as the guest wrote them." }),
      list.map(function (r, i) {
        var name = "review " + (i + 1), arabic = /[\u0600-\u06FF]/.test(r.text);
        return h("div", { class: "card review" },
          h("div", { class: "trip-top" }, h("b", { text: "Review " + (i + 1) }), rowTools(list, i, name)),
          field("The guest's words", textInput(r.text, function (v) { r.text = v; }, { rows: 3, ar: arabic, auto: true })),
          field("Guest's name", textInput(r.name, function (v) { r.name = v; }), "Can be left empty."),
          field("Where and when (English)", textInput(r.when.en, function (v) { r.when.en = v; }, { placeholder: "Tripadvisor, October 2025" })),
          field("Where and when (Arabic)", textInput(r.when.ar, function (v) { r.when.ar = v; }, { ar: true, placeholder: "Tripadvisor، أكتوبر ٢٠٢٥" })));
      }),
      h("button", { type: "button", class: "btn ghost", onclick: function () { list.push({ name: "", text: "", when: { en: "", ar: "" } }); render(); } }, "+ Add a review"),
      h("p", { class: "note", text: "A review written in Arabic is shown as Arabic on both the English and the Arabic pages." }));
  }

  function viewPhotos() {
    var groups = [], by = {};
    S.slots.forEach(function (s) {
      if (!by[s.group]) { by[s.group] = []; groups.push(s.group); }
      by[s.group].push(s);
    });
    return h("section", null,
      h("p", { class: "intro", text: "Choose a new photo and it takes the place of the old one. It is cut to the same shape, from the middle, so check the preview before you publish." }),
      groups.map(function (g) {
        return h("div", { class: "group" }, h("h2", { text: g }),
          h("div", { class: "photos" }, by[g].map(function (s) {
            var p = S.photos.get(s.path);
            var input = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", class: "sr", onchange: function (e) { choosePhoto(s, e.target.files[0]); e.target.value = ""; } });
            return h("figure", { class: "photo" + (p ? " new" : "") },
              h("div", { class: "frame", style: null },
                h("img", { src: p ? p.url : S.shown[s.path] || s.thumb, alt: s.alt, loading: "lazy", width: s.w, height: s.h }),
                p ? h("span", { class: "badge", text: "New, not published" }) : null),
              h("figcaption", null,
                h("b", { text: s.label }),
                p && p.blurry ? h("span", { class: "hint warn", text: "This photo is small (" + p.blurry + ") and may look blurry. Best is " + s.w + " × " + s.h + " or larger." }) : null,
                h("span", { class: "photo-btns" },
                  h("label", { class: "btn small" }, input, p ? "Choose another" : "Replace"),
                  p ? h("button", { type: "button", class: "btn small ghost", onclick: function () { undoPhoto(s); } }, "Undo") : null)));
          })));
      }));
  }

  /* ---------------------------------------------------------------- bookings */
  function bk(path, opts) {
    opts = opts || {};
    var headers = { Authorization: "Bearer " + S.token };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(BOOK + path, { method: opts.body ? "POST" : "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store" })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          if (res.ok) return j;
          throw friendly(j.message || "The booking system answered " + res.status + ".");
        });
      }, function () { throw friendly("The booking system could not be reached. Check your connection and try again."); });
  }
  function plusDays(iso, n) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dayText(iso, long) { return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" }); }
  function roomName(id) { var r = ROOMS.filter(function (x) { return x[0] === id; })[0]; return r ? r[1] : id; }

  function loadBookings() {
    var B = S.bk;
    B.loading = true; B.error = null;
    render();
    var first = B.today ? Promise.resolve() : bk("/admin/calendar?days=1").then(function (c) { B.today = c.today; B.calFrom = c.today; });
    return first.then(function () {
      var from = B.range === "past" ? plusDays(B.today, -90) : B.today, to = B.range === "past" ? plusDays(B.today, -1) : plusDays(B.today, 365);
      return Promise.all([bk("/admin/bookings?from=" + from + "&to=" + to), bk("/admin/calendar?from=" + B.calFrom + "&days=14")]);
    }).then(function (r) {
      B.list = r[0].bookings; B.cal = r[1]; B.loading = false;
      render();
    }).catch(function (e) { B.loading = false; B.error = explain(e); render(); });
  }
  function act(b, action, extra) {
    var B = S.bk;
    B.acting = b.ref; B.sure = null; B.error = null;
    render();
    var body = Object.assign({ action: action }, extra || {});
    return bk("/admin/bookings/" + b.ref, { body: body }).then(function () { B.acting = null; return loadBookings(); })
      .catch(function (e) { B.acting = null; B.error = explain(e); render(); window.scrollTo(0, 0); });
  }
  function waLink(b, text) { return "https://wa.me/" + b.phone.replace(/\D/g, "") + "?text=" + encodeURIComponent(text); }
  function confirmText(b) {
    return "Hello " + b.first + ", this is Giza Pyramids View Guest House. Your booking " + b.ref + " is confirmed: " + dayText(b.in, true) + " to " + dayText(b.out, true) + ", " +
      b.rooms.map(function (r) { return r.qty + " × " + roomName(r.id); }).join(", ") + ". We look forward to welcoming you.";
  }

  function bookingCard(b) {
    var B = S.bk, busy = B.acting === b.ref, block = b.kind === "block", past = b.out <= B.today;
    var who = block ? "Rooms closed" : (b.first + " " + b.last).trim() || "Guest";
    var note = h("input", { type: "text", value: b.note, maxlength: 500, placeholder: block ? "Why they are closed" : "A note only you see", "aria-label": "Note for " + b.ref });
    var rows = [
      ["Stay", dayText(b.in, true) + " → " + dayText(b.out, true) + " · " + plural(b.nights, "night")],
      ["Rooms", b.rooms.map(function (r) { return r.qty + " × " + roomName(r.id) + (r.price != null ? " (US$" + r.price + ")" : ""); }).join(", ")]
    ];
    if (!block) {
      rows.push(["Guests", plural(b.adults, "adult") + (b.children ? ", " + plural(b.children, "child").replace("childs", "children") : "")]);
      if (b.total != null) rows.push(["Total", "US$" + b.total + ", paid at the house"]);
      if (b.arrival) rows.push(["Arrival", b.arrival === "late" ? "After midnight" : b.arrival]);
      if (b.pickup) rows.push(["Airport pickup", b.flight || "Yes, flight not given"]);
      if (b.requests) rows.push(["Requests", b.requests]);
      if (b.email) rows.push(["Email", b.email]);
      rows.push(["Came from", b.source === "website" ? "The website, " + new Date(b.created).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : (SOURCES.filter(function (x) { return x[0] === b.source; })[0] || [0, b.source])[1]]);
    }
    if (b.status === "cancelled" && b.cancelledBy) rows.push(["Cancelled by", b.cancelledBy === "guest" ? "The guest, on the website" : "The house"]);
    var btns = [];
    if (b.status === "pending") btns.push(h("button", { type: "button", class: "btn primary small", disabled: busy, onclick: function () { act(b, "confirm"); } }, "Confirm"));
    if (!block && b.phone && b.status !== "cancelled") btns.push(h("a", { class: "btn small wa", href: waLink(b, b.status === "confirmed" ? confirmText(b) : "Hello " + b.first + ", this is Giza Pyramids View Guest House, about your booking " + b.ref + "."), target: "_blank", rel: "noopener" }, "WhatsApp the guest"));
    if (b.status !== "cancelled" && !past) {
      var sure = B.sure === b.ref;
      btns.push(h("button", { type: "button", class: "btn small " + (sure ? "danger" : "ghost"), disabled: busy, onclick: function () { if (sure) act(b, "cancel"); else { B.sure = b.ref; render(); } } }, sure ? (block ? "Yes, reopen them" : "Yes, cancel it") : (block ? "Reopen these rooms" : "Cancel booking")));
      if (sure) btns.push(h("button", { type: "button", class: "btn small ghost", onclick: function () { B.sure = null; render(); } }, "Keep it"));
    }
    if (b.status === "cancelled" && !past) btns.push(h("button", { type: "button", class: "btn small ghost", disabled: busy, onclick: function () { act(b, "restore"); } }, "Restore"));
    return h("div", { class: "card bkg " + b.status + (block ? " block" : "") },
      h("div", { class: "bkg-top" },
        h("div", null, h("b", { class: "bkg-who", text: who }), block ? null : h("span", { class: "bkg-ref", text: b.ref })),
        h("span", { class: "chip " + b.status, text: block ? (b.status === "cancelled" ? "Reopened" : "Closed") : b.status === "pending" ? "New, waiting for you" : b.status === "confirmed" ? "Confirmed" : "Cancelled" })),
      !block && b.phone ? h("p", { class: "bkg-phone" }, h("a", { href: "tel:" + b.phone.replace(/[^\d+]/g, ""), dir: "ltr", text: b.phone })) : null,
      h("dl", { class: "bkg-rows" }, rows.map(function (r) { return [h("dt", { text: r[0] }), h("dd", { text: r[1], dir: "auto" })]; })),
      h("div", { class: "bkg-note" }, note,
        h("button", { type: "button", class: "btn small ghost", disabled: busy, onclick: function () { act(b, "note", { note: note.value }); } }, "Save note")),
      btns.length ? h("div", { class: "bkg-btns" }, btns) : null,
      busy ? h("p", { class: "hint", text: "Saving…" }) : null);
  }

  function calendar() {
    var B = S.bk, c = B.cal;
    if (!c) return null;
    var days = [];
    for (var i = 0; i < c.days; i++) days.push(plusDays(c.from, i));
    function go(by) { B.calFrom = plusDays(B.calFrom, by); loadBookings(); }
    return h("div", { class: "card cal" },
      h("div", { class: "cal-top" },
        h("h2", { text: "Rooms taken, night by night" }),
        h("span", { class: "cal-nav" },
          h("button", { type: "button", class: "icon", "aria-label": "Two weeks earlier", onclick: function () { go(-14); } }, "←"),
          h("button", { type: "button", class: "btn small ghost", disabled: B.calFrom === B.today, onclick: function () { B.calFrom = B.today; loadBookings(); } }, "Today"),
          h("button", { type: "button", class: "icon", "aria-label": "Two weeks later", onclick: function () { go(14); } }, "→"))),
      h("div", { class: "cal-scroll" }, h("table", null,
        h("thead", null, h("tr", null, h("th", { scope: "col", text: "Night of" }), days.map(function (d) {
          var dt = new Date(d + "T00:00:00Z");
          return h("th", { scope: "col", class: d === B.today ? "today" : null }, h("small", { text: dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }) }), String(dt.getUTCDate()), h("small", { text: dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) }));
        }))),
        h("tbody", null, ROOMS.map(function (r) {
          var room = c.rooms[r[0]];
          return h("tr", null, h("th", { scope: "row" }, r[1], h("small", { text: plural(room.count, "room") })), room.taken.map(function (n, i) {
            return h("td", { class: (n >= room.count ? "full" : n ? "some" : "free") + (days[i] === B.today ? " today" : ""), title: n + " of " + room.count + " taken", text: n ? n + "/" + room.count : "·" });
          }));
        })))),
      h("p", { class: "hint", text: "2/3 means two of the three rooms are taken that night. A dark cell is full." }));
  }

  function bookingForm() {
    var B = S.bk, f = B.form, block = f.kind === "block";
    function inp(key, props) { return h("input", Object.assign({ value: f[key] || "", oninput: function (e) { f[key] = e.target.value; } }, props)); }
    function submit(e) {
      e.preventDefault();
      if (B.acting) return;
      var rooms = {};
      ROOMS.forEach(function (r) { if (f.rooms[r[0]]) rooms[r[0]] = f.rooms[r[0]]; });
      if (!f.in || !f.out || f.out <= f.in) { B.formError = "Choose the first night and the day they leave; the leaving day must be later."; return render(); }
      if (!Object.keys(rooms).length) { B.formError = "Choose at least one room."; return render(); }
      if (!block && !oneLine(f.first) && !oneLine(f.last)) { B.formError = "Write the guest's name."; return render(); }
      var body = { kind: f.kind, in: f.in, out: f.out, rooms: rooms, note: f.note || "" };
      if (!block) Object.assign(body, { first: f.first || "", last: f.last || "", phone: f.phone || "", source: f.source, adults: parseInt(f.adults, 10) || 2, children: 0 });
      B.acting = "form"; B.formError = null;
      render();
      bk("/admin/bookings", { body: body }).then(function () { B.acting = null; B.form = null; return loadBookings(); })
        .catch(function (err) { B.acting = null; B.formError = explain(err); render(); });
    }
    return h("form", { class: "card bk-form", onsubmit: submit },
      h("h2", { text: block ? "Close rooms" : "Add a booking" }),
      h("p", { class: "intro", text: block ? "Take rooms off the website for some nights, for repairs or a stay you do not want to write down. Guests cannot book them until you reopen them." : "For a booking that did not come through the website: WhatsApp, the phone, a walk-in or Booking.com. It is confirmed straight away and the rooms come off the website." }),
      B.formError ? h("div", { class: "status bad", role: "alert" }, h("span", { text: B.formError })) : null,
      h("div", { class: "two" },
        field(block ? "First night closed" : "Arrives", inp("in", { type: "date", required: true })),
        field(block ? "Open again on" : "Leaves", inp("out", { type: "date", required: true }))),
      h("div", { class: "bk-rooms" }, h("span", { class: "lbl", text: "Rooms" }), ROOMS.map(function (r) {
        return h("label", { class: "line" }, h("span", { class: "name", text: r[1] }),
          h("select", { "aria-label": r[1], onchange: function (e) { f.rooms[r[0]] = parseInt(e.target.value, 10); } }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return h("option", { value: n, selected: (f.rooms[r[0]] || 0) === n, text: String(n) }); })));
      })),
      block ? null : h("div", { class: "two" }, field("First name", inp("first", { type: "text", maxlength: 60 })), field("Last name", inp("last", { type: "text", maxlength: 60 }))),
      block ? null : h("div", { class: "two" },
        field("Mobile, with country code", inp("phone", { type: "text", inputmode: "tel", dir: "ltr", maxlength: 30, placeholder: "+" })),
        field("Adults", inp("adults", { type: "text", inputmode: "numeric", maxlength: 2, class: "num" }))),
      block ? null : field("Came from", h("select", { onchange: function (e) { f.source = e.target.value; } }, SOURCES.map(function (x) { return h("option", { value: x[0], selected: f.source === x[0], text: x[1] }); }))),
      field(block ? "Why (only you see this)" : "Note (only you see this)", inp("note", { type: "text", maxlength: 500 })),
      h("div", { class: "bkg-btns" },
        h("button", { type: "submit", class: "btn primary", disabled: B.acting === "form" }, B.acting === "form" ? "Saving…" : block ? "Close these rooms" : "Add the booking"),
        h("button", { type: "button", class: "btn ghost", onclick: function () { B.form = null; B.formError = null; render(); } }, "Never mind")));
  }

  function viewBookings() {
    var B = S.bk;
    if (!B.list && !B.loading && !B.error) { setTimeout(loadBookings, 0); return h("section", null, h("p", { class: "intro", text: "Loading the bookings…" })); }
    if (B.form) return h("section", null, bookingForm());
    var list = B.list || [];
    var fresh = list.filter(function (b) { return b.status === "pending"; });
    var live = list.filter(function (b) { return b.status === "confirmed"; });
    var gone = list.filter(function (b) { return b.status === "cancelled"; });
    function open(kind) { B.form = { kind: kind, rooms: {}, source: "whatsapp", adults: "2", in: B.today, out: plusDays(B.today, 1) }; B.formError = null; render(); window.scrollTo(0, 0); }
    return h("section", null,
      h("p", { class: "intro", text: "Every booking made on the website lands here and holds its rooms at once. Confirm it and tell the guest on WhatsApp; cancel it and the rooms go back on sale." }),
      B.error ? h("div", { class: "status bad", role: "alert" }, h("span", { text: B.error })) : null,
      h("div", { class: "bk-tools" },
        h("button", { type: "button", class: "btn primary", onclick: function () { open("guest"); } }, "+ Add a booking"),
        h("button", { type: "button", class: "btn ghost", onclick: function () { open("block"); } }, "Close rooms"),
        h("button", { type: "button", class: "btn ghost", disabled: B.loading, onclick: loadBookings }, B.loading ? "Loading…" : "Refresh")),
      B.range === "next" && fresh.length ? h("div", { class: "group" }, h("h2", { text: "New, waiting for you (" + fresh.length + ")" }), fresh.map(bookingCard)) : null,
      B.range === "next" ? calendar() : null,
      h("div", { class: "bk-range" },
        h("button", { type: "button", class: B.range === "next" ? "on" : null, onclick: function () { B.range = "next"; loadBookings(); } }, "Coming"),
        h("button", { type: "button", class: B.range === "past" ? "on" : null, onclick: function () { B.range = "past"; loadBookings(); } }, "Last 90 days")),
      h("div", { class: "group" }, h("h2", { text: (B.range === "next" ? "Confirmed and coming" : "Stays in the last 90 days") + " (" + live.length + ")" }),
        live.length ? live.map(bookingCard) : h("p", { class: "note", text: B.list ? "Nothing here yet." : "" })),
      gone.length ? h("div", { class: "group" },
        h("button", { type: "button", class: "btn small ghost", onclick: function () { B.showCancelled = !B.showCancelled; render(); } }, (B.showCancelled ? "Hide" : "Show") + " cancelled (" + gone.length + ")"),
        B.showCancelled ? gone.map(bookingCard) : null) : null);
  }

  var VIEWS = { bookings: viewBookings, rooms: viewRooms, contact: viewContact, scores: viewScores, reviews: viewReviews, photos: viewPhotos };

  function statusBox() {
    var s = S.status;
    if (!s) return null;
    return h("div", { class: "status " + s.kind, role: s.kind === "bad" ? "alert" : "status" },
      s.kind === "work" ? h("span", { class: "spin", "aria-hidden": "true" }) : null,
      h("span", { text: s.text }),
      s.link ? h("a", { href: SITE, target: "_blank", rel: "noopener", text: "View the website" }) : null);
  }
  function errorBox() {
    var here = S.errors;
    if (!here.length) return null;
    return h("div", { class: "status bad", role: "alert" },
      h("div", null, h("b", { text: "Please fix this before publishing:" }),
        h("ul", null, here.slice(0, 8).map(function (e) { return h("li", { text: e.msg }); }),
          here.length > 8 ? h("li", { text: "…and " + (here.length - 8) + " more." }) : null)));
  }

  // The bar at the bottom is redrawn on every keystroke; the rest only when the structure changes.
  var barEl = null;
  function bar() {
    if (!barEl) return;
    var what = changes();
    barEl.hidden = !what.length && !S.busy;
    barEl.replaceChildren(
      h("span", { class: "what", text: S.busy ? "Publishing…" : "Changed: " + what.join(", ") }),
      h("span", { class: "bar-btns" },
        h("button", { type: "button", class: "btn ghost light", disabled: S.busy, onclick: function () { if (confirmDiscard()) discard(); } }, "Discard"),
        h("button", { type: "button", class: "btn primary", disabled: S.busy, onclick: publish }, "Publish")));
    document.body.classList.toggle("has-bar", !barEl.hidden);
  }
  function confirmDiscard() { return window.confirm("Throw away the changes you have not published?"); }

  function render() {
    if (!S.token) return renderSignIn();
    if (!S.draft) return;
    var when = S.updated ? new Date(S.updated).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
    barEl = h("div", { class: "bar", hidden: true });
    app.replaceChildren(
      h("header", { class: "top" },
        h("div", { class: "wrap" },
          h("div", { class: "brand" }, h("img", { src: SITE + "apple-touch-icon.png", alt: "", width: 38, height: 38 }),
            h("div", null, h("b", { text: "Pyramids View Guest House" }), h("span", { text: "Bookings and website" }))),
          h("div", { class: "top-links" },
            h("a", { href: SITE, target: "_blank", rel: "noopener", text: "View site" }),
            h("button", { type: "button", class: "link", onclick: signOut }, "Sign out")))),
      h("nav", { class: "tabs", "aria-label": "Sections" },
        h("div", { class: "wrap" }, TABS.map(function (t) {
          return h("button", {
            type: "button", class: S.tab === t[0] ? "on" : null, "aria-current": S.tab === t[0] ? "page" : null,
            onclick: function () { S.tab = t[0]; render(); window.scrollTo(0, 0); }
          }, t[1]);
        }))),
      h("main", { class: "wrap" },
        BRANCH !== "main" ? h("div", { class: "status warn" }, h("span", { text: "Test mode: changes go to the “" + BRANCH + "” branch, not to the live website." })) : null,
        statusBox(), errorBox(),
        h("h1", { text: TABS.filter(function (t) { return t[0] === S.tab; })[0][1] }),
        VIEWS[S.tab](),
        when ? h("p", { class: "foot", text: "Last published from this dashboard: " + when }) : null),
      barEl);
    bar();
  }

  // The login is not checked by a server (there is none). The password unlocks the
  // GitHub access key kept, locked, in admin/access.json (made by scripts/make_login.mjs).
  function unlock(login, password) {
    function bytes(s) { var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
    return fetch("access.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw friendly("The login has not been set up yet. Ask Jeevesh.");
      return r.json();
    }).then(function (a) {
      var enc = new TextEncoder();
      return crypto.subtle.importKey("raw", enc.encode(login.trim().toLowerCase() + "\n" + password.trim()), "PBKDF2", false, ["deriveKey"]).then(function (material) {
        return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: bytes(a.salt), iterations: a.iterations }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      }).then(function (key) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(a.iv) }, key, bytes(a.data));
      }).then(function (plain) { return new TextDecoder().decode(plain); }, function () {
        throw friendly("That login or password is not right. Check the spelling and try again.");
      });
    });
  }

  function renderSignIn(message) {
    var login = h("input", { type: "text", autocomplete: "username", autocapitalize: "none", "aria-label": "Login", placeholder: "Login" });
    var password = h("input", { type: "password", autocomplete: "current-password", "aria-label": "Password", placeholder: "Password" });
    var msg = h("p", { class: "status bad", role: "alert", hidden: !message, text: message || "" });
    var btn = h("button", { type: "submit", class: "btn primary" }, "Open the dashboard");
    app.replaceChildren(h("main", { class: "signin" },
      h("img", { src: SITE + "apple-touch-icon.png", alt: "Giza Pyramids View Guest House", width: 84, height: 84 }),
      h("h1", { text: "Website dashboard" }),
      h("p", { text: "See and confirm bookings, and change room prices, the phone and WhatsApp numbers, review scores, guest reviews and photos on the guest house's website." }),
      h("form", { onsubmit: function (e) {
        e.preventDefault();
        if (!login.value.trim() || !password.value.trim()) return;
        btn.disabled = true;
        btn.textContent = "Checking…";
        unlock(login.value, password.value).then(start).catch(function (err) {
          S.token = null;
          renderSignIn(err.status === 401 ? "The login is right, but the access key behind it has expired. Please tell Jeevesh." : explain(err));
        });
      } }, msg, login, password, btn),
      h("p", { class: "hint", text: "You stay signed in on this device. Use “Sign out” on a shared phone or computer." })));
  }

  function signOut() {
    if (dirty() && !confirmDiscard()) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
    S.token = S.draft = S.saved = null;
    S.bk.list = S.bk.cal = S.bk.form = null;
    S.photos.clear();
    renderSignIn();
  }

  function start(key) {
    S.token = key;
    return Promise.all([loadContent(), loadSlots()]).then(function () {
      try { localStorage.setItem(KEY, key); } catch (e) { /* private mode: stay signed in for this visit */ }
      render();
    });
  }

  /* ---------------------------------------------------------------- boot */
  var stored = null;
  // A set-up link can carry the key after "#key=", so it never reaches a server.
  var m = /^#key=(.+)$/.exec(location.hash);
  if (m) {
    stored = decodeURIComponent(m[1]);
    history.replaceState(null, "", location.pathname + location.search);
  } else {
    try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  }
  if (stored) {
    start(stored).catch(function (err) {
      S.token = null;
      renderSignIn(err.status === 401 ? "Please sign in again." : explain(err));
    });
  } else {
    renderSignIn();
  }
})();
