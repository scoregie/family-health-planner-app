// The app's "server", running on the phone itself.
//
// The pages were first written for a self-hosted server, so they call addresses like /api/state
// with fetch(). This file answers those calls on the device instead: it replaces window.fetch for
// /api/, /auth/ and plan.json, and keeps everything in one JSON file in the app's private storage
// (or in localStorage when the pages are opened in an ordinary browser for testing).
//
// Nothing here talks to the internet. Each page loads this file first, before anything else.
(function () {
  "use strict";

  var FILE = "family-health-planner.json";
  var KEEP_BACKUPS = 10;
  var realFetch = window.fetch.bind(window);

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  function emptyStore() {
    return {
      v: 1,
      people: [],          // [{key: "p1", name: "Alex", portion: 1}] in household order
      profiles: {},        // person -> {answers, updated_at, finished_at}
      plan: null,          // the plan in use
      backups: [],         // [{at, plan}] newest first
      draft: null,         // {id, title, created_at, plan, notes} waiting to be approved
      state: { users: {}, shared: null, have: [], updated: {}, epoch: Date.now() },
      mealLog: [],         // what was eaten and rated, kept across plans (for Progress)
      exLog: [],           // exercise sessions ticked
      measurements: [],    // [{id, person, date, kind, value, source}]
      settings: { appearance: {}, stores: [], energy: "", pins: {} },
      nextId: 1,
    };
  }

  function native() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  function fs() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  }

  var store = null;

  function load() {
    if (native() && fs()) {
      return fs().readFile({ path: FILE, directory: "DATA", encoding: "utf8" })
        .then(function (r) { return JSON.parse(r.data); })
        .catch(function () { return null; });
    }
    try {
      var text = localStorage.getItem("fhp-store");
      return Promise.resolve(text ? JSON.parse(text) : null);
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // Writes a copy first, then renames it over the real file, so a crash mid-write can't lose data.
  var writing = Promise.resolve();
  function save() {
    var text = JSON.stringify(store);
    writing = writing.then(function () {
      if (native() && fs()) {
        return fs().writeFile({ path: FILE + ".tmp", directory: "DATA", data: text, encoding: "utf8" })
          .then(function () { return fs().rename({ from: FILE + ".tmp", to: FILE, directory: "DATA", toDirectory: "DATA" }); });
      }
      try { localStorage.setItem("fhp-store", text); } catch (e) { /* full or blocked */ }
    }).catch(function (e) { console.error("Could not save:", e); });
    return writing;
  }

  var ready = load().then(function (saved) {
    store = Object.assign(emptyStore(), saved || {});
    store.settings = Object.assign(emptyStore().settings, store.settings || {});
    store.state = Object.assign(emptyStore().state, store.state || {});
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function toKey(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  function isObj(v) {
    return v && typeof v === "object" && !Array.isArray(v);
  }
  function dishKey(name) {
    return String(name || "").replace(/\s*\(packed\)\s*$/i, "").trim().toLowerCase();
  }
  function newId() {
    return store.nextId++;
  }

  var QUESTIONS = null;
  function questions() {
    if (QUESTIONS) return Promise.resolve(QUESTIONS);
    return realFetch("questions.json").then(function (r) { return r.json(); }).then(function (q) { QUESTIONS = q; return q; });
  }
  var LIBRARY = null;
  function library() {
    if (LIBRARY) return Promise.resolve(LIBRARY);
    return realFetch("library.json").then(function (r) { return r.json(); }).then(function (l) { LIBRARY = l; return l; });
  }

  // The plan builder (planbuilder.js), loaded in its own scope only when a plan is drafted, so its
  // names can't clash with the page's.
  var BUILDER = null;
  function builder() {
    if (BUILDER) return Promise.resolve(BUILDER);
    return realFetch("planbuilder.js").then(function (r) { return r.text(); }).then(function (code) {
      var mod = { exports: {} };
      new Function("module", "window", code)(mod, {});
      BUILDER = mod.exports;
      return BUILDER;
    });
  }

  // The household with each person's answers, in the shape the plan builder expects.
  function household() {
    return store.people.map(function (p) {
      var person = toKey(p.name);
      var profile = store.profiles[person];
      var answers = (profile && profile.answers) || {};
      return {
        key: p.key, person: person, name: p.name, portion: p.portion, login: null,
        answered: Object.keys(answers).length,
        finished: !!(profile && profile.finished_at),
        updated: profile ? profile.updated_at : null,
        answers: answers,
      };
    });
  }
  function personKeys() {
    return store.people.map(function (p) { return toKey(p.name); });
  }
  function firstPerson() {
    return store.people.length ? toKey(store.people[0].name) : "you";
  }

  function cleanAnswers(answers, q) {
    var all = {};
    q.sections.forEach(function (s) { s.questions.forEach(function (x) { all[x.id] = x; }); });
    var out = {};
    if (!isObj(answers)) return out;
    Object.keys(answers).forEach(function (id) {
      var value = answers[id];
      var x = all[id];
      if (!x) return;
      if (x.type === "text" || x.type === "long") {
        if (typeof value === "string" && value.trim()) out[id] = value.slice(0, 2000);
      } else if (x.type === "number") {
        var n = Number(value);
        if (value !== "" && value !== null && isFinite(n) && (x.min == null || n >= x.min) && (x.max == null || n <= x.max)) out[id] = n;
      } else if (x.type === "choice") {
        if (x.options.indexOf(value) > -1) out[id] = value;
      } else if (x.type === "multi") {
        var list = typeof value === "string" ? [value] : value;
        var picked = Array.isArray(list) ? x.options.filter(function (o) { return list.indexOf(o) > -1; }) : [];
        if (picked.length) out[id] = picked;
      }
    });
    return out;
  }

  function cleanRatings(ratings) {
    var out = {};
    if (!isObj(ratings)) return out;
    Object.keys(ratings).slice(0, 100).forEach(function (week) {
      var meals = ratings[week];
      if (!isObj(meals)) return;
      var w = {};
      Object.keys(meals).slice(0, 200).forEach(function (id) {
        var r = meals[id];
        if (!isObj(r) || id.length > 80) return;
        var s = Number.isInteger(r.s) && r.s >= 1 && r.s <= 10 ? r.s : undefined;
        var n = typeof r.n === "string" ? r.n.slice(0, 1000) : "";
        if (!s && !n.trim()) return;
        var kept = {};
        if (s) kept.s = s;
        if (n.trim()) kept.n = n;
        if (typeof r.t === "string" && r.t) kept.t = r.t.slice(0, 300);
        w[id] = kept;
      });
      if (Object.keys(w).length) out[week] = w;
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Meal and exercise history (the same rules as the server's database)
  // ---------------------------------------------------------------------------

  function planKeyFor(plan, person) {
    var block = (plan && plan.people) || {};
    return Object.keys(block).filter(function (k) { return block[k] && block[k].name && toKey(block[k].name) === person; })[0] || null;
  }

  function plannedDish(plan, weekIndex, dayName, slot, planKey) {
    var week = plan.weeks[weekIndex];
    var day = week && (week.meals || []).filter(function (d) { return d.day === dayName; })[0];
    if (!day) return null;
    var p = planKey ? (plan.people || {})[planKey] : null;
    var school = p && p.weekday && p.weekday[dayName];
    var dish = slot === "School snack" ? null : day[slot.toLowerCase()];
    if (slot === "Breakfast" && p && p.breakfast) dish = p.breakfast;
    if (slot === "Lunch" && school && school.lunch) dish = school.lunch;
    if (slot === "School snack" && school) dish = school.snack;
    var own = planKey && day.people && day.people[planKey];
    if (own && own[slot.toLowerCase()]) dish = own[slot.toLowerCase()];
    return dish || null;
  }

  function syncMeals(person, eaten, ratings) {
    var plan = store.plan;
    if (!plan || !Array.isArray(plan.weeks)) return;
    var planId = String(plan.id || "default");
    var roundId = store.state.epoch || 0;
    var planKey = planKeyFor(plan, person);
    var now = Date.now();
    var current = {};
    function slotFor(week, id) {
      var parts = String(id).split("|");
      if (!parts[0] || !parts[1]) return null;
      var key = week + "|" + parts[0] + "|" + parts[1];
      if (!current[key]) current[key] = { week: +week, day: parts[0], slot: parts[1], eaten: false, rating: null };
      return current[key];
    }
    Object.keys(eaten || {}).forEach(function (week) {
      (Array.isArray(eaten[week]) ? eaten[week] : []).forEach(function (id) { var r = slotFor(week, id); if (r) r.eaten = true; });
    });
    Object.keys(ratings || {}).forEach(function (week) {
      Object.keys(ratings[week] || {}).forEach(function (id) { var r = slotFor(week, id); if (r) r.rating = ratings[week][id]; });
    });
    var mine = function (r) { return r.person === person && r.plan_id === planId && r.round === roundId; };
    var firstEaten = {};
    store.mealLog.filter(mine).forEach(function (r) { firstEaten[r.week + "|" + r.day + "|" + r.slot] = r.eaten_at; });
    store.mealLog = store.mealLog.filter(function (r) { return !mine(r); });
    Object.keys(current).forEach(function (key) {
      var row = current[key];
      var week = plan.weeks[row.week];
      if (!week) return;
      var rating = row.rating || {};
      var planned = rating.t || plannedDish(plan, row.week, row.day, row.slot, planKey);
      var dish = planned ? String(planned).replace(/\s*\(packed\)\s*$/i, "").trim() : null;
      store.mealLog.push({
        person: person, plan_id: planId, round: roundId, week: row.week, week_name: week.name || null,
        day: row.day, slot: row.slot, dish: dish, eaten: row.eaten,
        eaten_at: row.eaten ? (firstEaten[key] || now) : null,
        score: Number.isInteger(rating.s) ? rating.s : null,
        note: typeof rating.n === "string" && rating.n.trim() ? rating.n : null,
        macros: dish && plan.macros ? (plan.macros[dish] || plan.macros[dishKey(dish)] || null) : null,
        updated_at: now,
      });
    });
  }

  function syncExercise(person, ticks) {
    var plan = store.plan;
    if (!plan || !Array.isArray(plan.weeks)) return;
    var planId = String(plan.id || "default");
    var roundId = store.state.epoch || 0;
    var planKey = planKeyFor(plan, person);
    var now = Date.now();
    var current = {};
    Object.keys(ticks || {}).forEach(function (week) {
      (Array.isArray(ticks[week]) ? ticks[week] : []).forEach(function (id) {
        var dash = String(id).indexOf("-");
        if (dash < 1) return;
        current[week + "|" + String(id).slice(0, dash) + "|" + String(id).slice(dash + 1)] = { week: +week, day: String(id).slice(0, dash), slot: String(id).slice(dash + 1) };
      });
    });
    var mine = function (r) { return r.person === person && r.plan_id === planId && r.round === roundId; };
    var kept = {};
    store.exLog.filter(mine).forEach(function (r) { kept[r.week + "|" + r.day + "|" + r.slot] = r; });
    store.exLog = store.exLog.filter(function (r) { return !mine(r); });
    Object.keys(current).forEach(function (key) {
      if (kept[key]) { store.exLog.push(kept[key]); return; }
      var row = current[key];
      var ex = plan.weeks[row.week] && plan.weeks[row.week].exercise;
      if (!ex) return;
      var plans = Array.isArray(ex.days) ? ex : ex[planKey];
      var day = plans && Array.isArray(plans.days) ? plans.days.filter(function (x) { return x.day === row.day; })[0] : null;
      store.exLog.push({ person: person, plan_id: planId, round: roundId, week: row.week, day: row.day, slot: row.slot,
        session: day && day[row.slot] ? String(day[row.slot]) : null, done_at: now });
    });
  }

  // ---------------------------------------------------------------------------
  // Progress (a copy of the server's weekly summary)
  // ---------------------------------------------------------------------------

  var DAY = 86400000;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function localDate(ms) { var d = new Date(ms); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(date, n) { var d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function mondayOf(date) { var d = new Date(date + "T12:00:00Z"); return addDays(date, -((d.getUTCDay() + 6) % 7)); }
  function average(list) { return list.length ? list.reduce(function (a, b) { return a + b; }, 0) / list.length : null; }
  function round(n, places) { if (n === null || n === undefined) return null; var f = Math.pow(10, places); return Math.round(n * f) / f; }
  function kjOf(m) { return 17 * (m.p || 0) + 17 * (m.c || 0) + 37 * (m.f || 0); }
  var PREFER = { weight: ["manual", "apple-health", "health-connect"], steps: ["apple-health", "health-connect", "manual"] };

  function summary(person, weeks) {
    var today = localDate(Date.now());
    var firstWeek = addDays(mondayOf(today), -7 * (weeks - 1));
    var byKind = {};
    var manual = [];
    store.measurements.filter(function (m) { return m.person === person && m.date >= firstWeek; }).forEach(function (m) {
      var order = PREFER[m.kind] || [m.source];
      var map = byKind[m.kind] || (byKind[m.kind] = {});
      var cur = map[m.date];
      var rank = function (s) { return order.indexOf(s) < 0 ? 99 : order.indexOf(s); };
      if (!cur || rank(m.source) < rank(cur.source)) map[m.date] = { value: m.value, source: m.source };
      if (m.source === "manual" && m.kind === "weight") manual.push({ id: m.id, date: m.date, weight: m.value });
    });
    var list = [];
    var index = {};
    for (var i = 0; i < weeks; i++) {
      var start = addDays(firstWeek, 7 * i);
      index[start] = list.length;
      list.push({ week: start, weight: [], steps: [], active_energy: [], workouts: 0, workout_minutes: 0,
        energy_in: [], protein_in: [], meals: 0, plan_kj: {}, plan_protein: {}, scores: [], sessions: 0 });
    }
    function weekOf(date) { return date >= firstWeek && date <= today ? list[index[mondayOf(date)]] : null; }
    ["weight", "steps", "active_energy", "energy_in", "protein_in"].forEach(function (kind) {
      Object.keys(byKind[kind] || {}).forEach(function (date) { var w = weekOf(date); if (w) w[kind].push(byKind[kind][date].value); });
    });
    ["workouts", "workout_minutes"].forEach(function (kind) {
      Object.keys(byKind[kind] || {}).forEach(function (date) { var w = weekOf(date); if (w) w[kind] += byKind[kind][date].value; });
    });
    var plan = store.plan || {};
    var planKey = planKeyFor(plan, person);
    var portion = Number(plan.people && plan.people[planKey] && plan.people[planKey].portion) || 1;
    var since = new Date(firstWeek + "T00:00:00").getTime() - DAY;
    store.mealLog.forEach(function (m) {
      if (m.person !== person) return;
      if (m.eaten && m.eaten_at >= since) {
        var date = localDate(m.eaten_at);
        var w = weekOf(date);
        if (w) {
          w.meals++;
          if (m.macros) {
            w.plan_kj[date] = (w.plan_kj[date] || 0) + kjOf(m.macros) * portion;
            w.plan_protein[date] = (w.plan_protein[date] || 0) + (m.macros.p || 0) * portion;
          }
        }
      }
      if (m.score && m.updated_at >= since) { var w2 = weekOf(localDate(m.updated_at)); if (w2) w2.scores.push(m.score); }
    });
    store.exLog.forEach(function (s) {
      if (s.person !== person || s.done_at < since) return;
      var w = weekOf(localDate(s.done_at));
      if (w) w.sessions++;
    });
    var vals = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
    var out = list.map(function (w) {
      return {
        week: w.week, weight: round(average(w.weight), 1), steps: round(average(w.steps), 0),
        active_energy: round(average(w.active_energy), 0), workouts: w.workouts, workout_minutes: round(w.workout_minutes, 0),
        energy_in: round(average(w.energy_in), 0), protein_in: round(average(w.protein_in), 0), meals: w.meals,
        plan_kj: round(average(vals(w.plan_kj)), 0), plan_protein: round(average(vals(w.plan_protein)), 0),
        score: round(average(w.scores), 1), sessions: w.sessions,
      };
    });
    var weighIns = Object.keys(byKind.weight || {}).sort().map(function (date) {
      return { date: date, weight: byKind.weight[date].value, source: byKind.weight[date].source };
    });
    var profile = store.profiles[person];
    var answers = (profile && profile.answers) || {};
    return {
      person: person, today: today, weeks: out, weighIns: weighIns,
      manual: manual.sort(function (a, b) { return a.date < b.date ? 1 : -1; }),
      goalWeight: Number(answers.goal_weight) || null, waiting: [], imported: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Plans
  // ---------------------------------------------------------------------------

  function savePlan(plan) {
    var old = store.plan;
    if (old) {
      store.backups.unshift({ at: new Date().toISOString(), plan: old });
      store.backups = store.backups.slice(0, KEEP_BACKUPS);
    }
    store.plan = plan;
    if (!old || old.id !== plan.id) {
      // A new plan: everyone's ticks start fresh. "At home" marks are kept (they go by name).
      store.state = { users: {}, shared: null, have: store.state.have || [], updated: {}, epoch: Date.now() };
    }
    // The plan's people become the household (the builder keeps everyone's keys and names).
    if (plan.people) {
      store.people.forEach(function (p) {
        if (plan.people[p.key]) p.portion = plan.people[p.key].portion;
      });
    }
  }

  function draftPreview(d) {
    var plan = d.plan || {};
    return {
      id: d.id, title: d.title, details: d.notes || null, created_at: d.created_at, user: "this phone",
      weeks: (plan.weeks || []).map(function (w) {
        return { name: w.name, kind: w.kind || null, cost: w.cost, dinners: (w.meals || []).map(function (m) { return m.day + ": " + m.dinner; }) };
      }),
      people: Object.keys(plan.people || {}).filter(function (k) { return plan.people[k] && plan.people[k].name; }).map(function (key) {
        var p = plan.people[key];
        var focus = (plan.weeks || []).filter(function (w) { return w.exercise; })
          .map(function (w) { return w.exercise[key] && w.exercise[key].focus; }).filter(Boolean)[0] || null;
        return { key: key, name: p.name, portion: p.portion, focus: focus,
          snacks: (p.snacks || []).map(function (s) { return (s.when ? s.when + ": " : "") + s.what; }) };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  function Fail(code, message) { this.code = code; this.message = message; }
  function fail(code, message) { throw new Fail(code, message); }

  function me() {
    return { user: "this phone", person: firstPerson(), admin: true, role: "owner", device: true };
  }

  function appearance() {
    var s = store.settings;
    // One phone, one set of choices: kept as "mine", with no separate household layer.
    return { house: s.appearance || {}, admin: false, stores: { mine: s.stores || [], house: [] },
      energy: { mine: s.energy || "", house: "" }, pins: s.pins || {} };
  }

  var PIN_HOSTS = { coles: "www.coles.com.au", woolworths: "www.woolworths.com.au", iga: "www.igashop.com.au",
    foodland: "www.foodlandsa.com.au", spudshed: "www.spudshed.com.au", drakes: "www.drakes.com.au" };
  var STORES = ["coles", "woolworths", "aldi", "iga", "foodland", "spudshed", "drakes"];
  var CHOICES = { theme: ["auto", "light", "dark"], colour: ["green", "teal", "blue", "purple", "berry", "orange", "olive", "slate"],
    font: ["atkinson", "lexend", "nunito", "literata", "system"], size: ["small", "normal", "large", "larger", "largest"] };

  function cleanPin(store, link) {
    try {
      var u = new URL(String(link).trim());
      var host = PIN_HOSTS[store];
      if (u.protocol !== "https:" || (u.hostname !== host && u.hostname !== host.replace(/^www\./, ""))) return "";
      return u.href.slice(0, 500);
    } catch (e) { return ""; }
  }

  function route(method, path, q, b) {
    var person = String(q.get("person") || firstPerson()).toLowerCase();

    if (path === "/auth/me") return me();
    if (path === "/auth/status") return { setup: false, mail: false };

    if (path === "/api/state" && method === "GET") return store.state;
    var um = path.match(/^\/api\/user\/([a-z0-9-]+)$/);
    if (um && method === "PUT") {
      if (personKeys().indexOf(um[1]) < 0) fail(404, "unknown user");
      if (!isObj(b.ex) || !isObj(b.eaten)) fail(400, "bad body");
      var old = (store.state.users[um[1]] || {}).ratings || {};
      var ratings = "ratings" in b ? cleanRatings(b.ratings) : old;
      store.state.users[um[1]] = { ex: b.ex, eaten: b.eaten, ratings: ratings };
      store.state.updated[um[1]] = Date.now();
      syncMeals(um[1], b.eaten, ratings);
      syncExercise(um[1], b.ex);
      return { ok: true };
    }
    if (path === "/api/shared" && method === "PUT") {
      if (!isObj(b.ticks)) fail(400, "bad body");
      var prev = (store.state.shared && store.state.shared.ticks) || {};
      var by = Object.assign({}, (store.state.shared && store.state.shared.by) || {});
      var still = {};
      var now = Date.now();
      Object.keys(b.ticks).forEach(function (week) {
        var was = prev[week] || [];
        (Array.isArray(b.ticks[week]) ? b.ticks[week] : []).forEach(function (id) {
          still[week + "|" + id] = 1;
          if (was.indexOf(id) < 0) by[week + "|" + id] = { who: firstPerson(), at: now };
        });
      });
      Object.keys(by).forEach(function (k) { if (!still[k]) delete by[k]; });
      store.state.shared = { ticks: b.ticks, by: by };
      store.state.updated.shared = now;
      return { ok: true, by: by };
    }
    if (path === "/api/have" && method === "PUT") {
      if (!Array.isArray(b.have)) fail(400, "bad body");
      store.state.have = b.have.filter(function (x) { return typeof x === "string"; }).slice(0, 2000);
      return { ok: true };
    }
    if (path === "/api/reset" && method === "POST") {
      store.state = { users: {}, shared: null, have: [], updated: {}, epoch: Date.now() };
      return { ok: true };
    }

    if (path === "/api/people" && method === "GET") {
      return { people: household().map(function (p) {
        return { key: p.key, person: p.person, name: p.name, portion: p.portion, logins: [], answered: p.updated };
      }), otherLogins: [] };
    }

    if (path === "/api/profile") {
      if (personKeys().indexOf(person) < 0) fail(404, "unknown person");
      var profile = store.profiles[person];
      if (method === "GET") {
        return { person: person, answers: profile ? profile.answers : null, updated_at: profile ? profile.updated_at : null,
          finished_at: profile ? profile.finished_at : null, canChangePassword: false };
      }
      if (method === "PUT") {
        if (typeof b.finished === "boolean" && b.answers === undefined) {
          profile = store.profiles[person] || (store.profiles[person] = { answers: {}, updated_at: Date.now(), finished_at: null });
          profile.finished_at = b.finished ? Date.now() : null;
          return { ok: true, finished_at: profile.finished_at };
        }
        return questions().then(function (qs) {
          var answers = cleanAnswers(b.answers, qs);
          var p = store.profiles[person] || (store.profiles[person] = { answers: {}, finished_at: null });
          p.answers = answers;
          p.updated_at = Date.now();
          return { ok: true, answers: answers };
        });
      }
    }

    if (path === "/api/family/person" && method === "POST") {
      var name = String(b.name || "").trim().slice(0, 40);
      if (!/[A-Za-z0-9]/.test(name)) fail(400, "Enter a name with at least one letter or number.");
      if (personKeys().indexOf(toKey(name)) > -1) fail(400, "There’s already someone called " + name + ".");
      if (store.people.length >= 12) fail(400, "That’s the most people one plan can hold.");
      var portion = Math.min(2.5, Math.max(0.3, Number(b.portion) || 1));
      var n = 1;
      var keys = store.people.map(function (p) { return p.key; });
      while (keys.indexOf("p" + n) > -1) n++;
      store.people.push({ key: "p" + n, name: name, portion: portion });
      return { ok: true, person: toKey(name) };
    }
    var fm = path.match(/^\/api\/family\/person\/([a-z0-9]+)$/);
    if (fm && method === "DELETE") {
      var gone = store.people.filter(function (p) { return p.key === fm[1]; })[0];
      if (!gone) fail(404, "unknown person");
      store.people = store.people.filter(function (p) { return p !== gone; });
      delete store.profiles[toKey(gone.name)];
      return { ok: true };
    }

    if (path === "/api/plan" && method === "GET") {
      return { plan: store.plan, version: String(store.backups.length) };
    }
    if (path === "/api/plan/setup" && method === "GET") {
      if (!QUESTIONS) return questions().then(function () { return route(method, path, q, b); });
      return {
        people: household().map(function (p) { var c = Object.assign({}, p); delete c.answers; return c; }),
        questions: QUESTIONS ? QUESTIONS.sections.reduce(function (n, s) { return n + s.questions.length; }, 0) : 0,
        claude: { enabled: false, own: false, reason: "AI isn’t in this version of the app yet.", name: null, provider: null, model: null },
        ai: { family: { provider: "none" }, keys: { anthropic: false, openai: false, gemini: false, ollama: false }, providers: {} },
        job: null,
        draft: store.draft ? draftPreview(store.draft) : null,
        isExample: !store.plan,
      };
    }
    if (path === "/api/plan/draft" && method === "POST") {
      if (!store.people.length) fail(400, "Add the people in your family first.");
      return Promise.all([library(), builder()]).then(function (got) {
        var people = household();
        var built = got[1].build(people, { seed: Date.now(), library: got[0] });
        store.draft = { id: newId(), title: "New 4-week plan for the family", created_at: Date.now(),
          plan: built.plan, notes: (built.notesForAdmin || []).join("\n") || null };
        return { ok: true, done: true };
      });
    }
    var rm = path.match(/^\/api\/requests\/(\d+)\/(approve|decline)$/);
    if (rm && method === "POST") {
      if (!store.draft || store.draft.id !== Number(rm[1])) fail(404, "That draft has gone. Make a new one.");
      if (rm[2] === "approve") savePlan(store.draft.plan);
      store.draft = null;
      return { ok: true };
    }

    if (path === "/api/appearance" && method === "GET") return appearance();
    if (path === "/api/appearance" && method === "PUT") {
      var choice = {};
      Object.keys(CHOICES).forEach(function (k) { if (b[k] && CHOICES[k].indexOf(b[k]) > -1) choice[k] = b[k]; });
      store.settings.appearance = choice;
      return { ok: true, house: choice };
    }
    if (path === "/api/appearance/stores" && method === "PUT") {
      store.settings.stores = Array.isArray(b.stores) ? b.stores.filter(function (s, i) { return STORES.indexOf(s) > -1 && b.stores.indexOf(s) === i; }) : [];
      return { ok: true, stores: appearance().stores };
    }
    if (path === "/api/appearance/energy" && method === "PUT") {
      store.settings.energy = b.energy === "kJ" || b.energy === "kcal" ? b.energy : "";
      return { ok: true, energy: appearance().energy };
    }
    if (path === "/api/appearance/pins" && method === "PUT") {
      var item = String(b.item || "").trim().toLowerCase().slice(0, 120);
      var where = String(b.store || "");
      if (!item || !Object.prototype.hasOwnProperty.call(PIN_HOSTS, where) || ["__proto__", "constructor", "prototype"].indexOf(item) > -1) fail(400, "bad request");
      var pins = store.settings.pins;
      if (b.url) {
        var link = cleanPin(where, b.url);
        if (!link) fail(400, "That doesn’t look like a product page on " + PIN_HOSTS[where] + ". Open the product there, copy its address, and paste it here.");
        pins[item] = Object.assign({}, pins[item]);
        pins[item][where] = link;
      } else if (pins[item]) {
        delete pins[item][where];
        if (!Object.keys(pins[item]).length) delete pins[item];
      }
      return { ok: true, pins: pins };
    }

    if (path === "/api/progress" && method === "GET") {
      var weeks = Math.min(52, Math.max(4, Number(q.get("weeks")) || 12));
      return summary(person, weeks);
    }
    if (path === "/api/measurements" && method === "POST") {
      var date = String(b.date || "");
      var kg = Number(b.weight);
      if (!/^\d{4}-\d\d-\d\d$/.test(date) || date > localDate(Date.now() + DAY)) fail(400, "Pick a date that isn’t in the future.");
      if (!(kg >= 20 && kg <= 400)) fail(400, "Enter a weight between 20 and 400 kg.");
      store.measurements = store.measurements.filter(function (m) { return !(m.person === person && m.date === date && m.kind === "weight" && m.source === "manual"); });
      store.measurements.push({ id: newId(), person: person, date: date, kind: "weight", value: Math.round(kg * 10) / 10, source: "manual" });
      return { ok: true };
    }
    if (path === "/api/measurements" && method === "DELETE") {
      var id = Number(q.get("id"));
      var before = store.measurements.length;
      store.measurements = store.measurements.filter(function (m) { return !(m.id === id && m.person === person); });
      if (store.measurements.length === before) fail(404, "not found");
      return { ok: true };
    }

    // Backup: everything in one file, and putting it back.
    if (path === "/api/backup" && method === "GET") return store;
    if (path === "/api/backup" && method === "PUT") {
      if (!isObj(b) || b.v !== 1 || !Array.isArray(b.people)) fail(400, "That isn’t a Family Health Planner backup.");
      store = Object.assign(emptyStore(), b);
      return { ok: true };
    }
    if (path === "/api/erase" && method === "POST") {
      store = emptyStore();
      return { ok: true };
    }

    fail(404, "not found");
  }

  function respond(code, body) {
    return new Response(JSON.stringify(body), { status: code, headers: { "Content-Type": "application/json" } });
  }

  // Answers a call from a page. Changes are saved before the answer goes back.
  function handle(url, init) {
    var method = String((init && init.method) || "GET").toUpperCase();
    var body = {};
    try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) { return Promise.resolve(respond(400, { error: "bad request" })); }
    return ready.then(function () {
      if (url.pathname === "/plan.json" || url.pathname.slice(-10) === "/plan.json") {
        return store.plan
          ? new Response(JSON.stringify(store.plan), { status: 200, headers: { "Content-Type": "application/json" } })
          : new Response("", { status: 404 });
      }
      return Promise.resolve(route(method, url.pathname.replace(/^.*?(\/(api|auth)\/)/, "$1"), url.searchParams, body)).then(function (answer) {
        var done = method === "GET" ? Promise.resolve() : save();
        return done.then(function () { return respond(200, answer); });
      });
    }).catch(function (e) {
      if (e instanceof Fail) return respond(e.code, { error: e.message });
      console.error(e);
      return respond(500, { error: "Something went wrong: " + String(e && e.message || e).slice(0, 200) });
    });
  }

  function ours(url) {
    if (url.origin !== location.origin) return false;
    return /\/(api|auth)\//.test(url.pathname) || /\/plan\.json$/.test(url.pathname);
  }

  window.fetch = function (input, init) {
    var url;
    try { url = new URL(typeof input === "string" ? input : input.url, location.href); } catch (e) { return realFetch(input, init); }
    if (!ours(url)) return realFetch(input, init);
    return handle(url, init || (typeof input === "object" ? { method: input.method } : undefined));
  };

  // For pages that need to wait for the data (such as the first-run check below).
  window.LocalAPI = {
    ready: ready,
    hasPlan: function () { return ready.then(function () { return !!store.plan; }); },
  };
})();
