# Changelog

Each version is tagged on GitHub (see Releases) with these notes.

## v0.9.0 (2026-11-23)

Catches up with the web version (v1.13.0):

- **"Unwell" under "Didn't have it?"**, for a meal you didn't have because you were sick. On
  those days, planned exercise sessions don't count as missed in "How the week went" (the page and
  the Today card), which shows "Unwell on N days". The "To consider" line suggests easing back in,
  and a GP or pharmacist if it carries on. The next plan doesn't change a dish because of it.

## v0.8.0 (2026-11-19)

Catches up with the web version (v1.12.2):

- **"Didn't have it?"** On a meal, "Rate or skip" lets you say why it wasn't eaten (no time, too
  much effort, missing ingredients, ate out, didn't want to eat it, and more). The next plan
  takes it into account: quicker dinners after busy weeks, and dishes someone didn't want offered
  less often for them.
- **"How the week went"**, a new page (linked from Progress, with a card on Today): what went
  well, what was harder, and one thing to consider next week, for last week or this week so far.
  It is worked out on the phone from what's stored there.
- **Cardio steps and new foods tried are now dated**, so they show up in the week they happened.
- **Easier pages** from the web version's review: clearer empty pages and buttons.

## v0.7.0 (2026-11-19)

Catches up with the web version (v1.11.0), and now
uses the web's pages unchanged:

- **Current food: an Edit button on every item**, to fix the wording or move it to another place.
  Two more lists: **Spices and seasonings** and **Fruit bowl and bench**.
- **Your country can be changed in Settings.** The card was hidden in the app before, although
  Family and plan pointed there.
- **Week 1 is "#week-1".** The address (and the cardio "How did that feel?" labels) count weeks as
  the plan names them; before, Stock-up 1 counted as a week.
- **Easier to use** (from the web version's review): readable red messages in dark mode, text boxes
  with visible edges, pop-up messages read out by screen readers, bigger tap areas, keyboard focus
  kept on the button pressed, and labels for fields that had none.
- **Fixes from the web version:** About me answers typed just before leaving the page are saved,
  shopping ticks can't be stopped by one odd save, the app moves on to the new day when left open
  overnight.
- Progress leaves out the steps, workout and Lose It charts and columns the app can't fill yet.
- Behind the scenes: the pages are the web version's own files, and `tools/port-from-web.sh`
  copies them across, so future updates from the web are a copy rather than a merge.
- **Progress counts meals from older plans.** A meal whose plan gave its energy only in kcal
  counted as 0 kJ eaten on Progress; it now counts, the same as on the Meals tab.
- Behind the scenes: the app's server (`local-api.js`) now uses the web version's own rules for
  people's keys, Current food, planned meals, exercise swaps and energy (`sharedrules.js` and
  `energy.js`) instead of its own copies. Swapping an exercise in a shared workout is no longer
  checked against one person's About me answers, the same as the web.

## v0.6.0 (2026-11-19)

Cardio levels from the web version (v1.10.1), and its newer plan builder:

- **Cardio starts at your level.** About me (Exercise) asks "For cardio, which is closest to what you can do now?", from "A 20-minute walk leaves me puffed" to "I run, ride or swim hard 3 or more times a week". The plan builder writes cardio at that level (easy walk, brisk walk, hills, walk-jog, jog, run; easy, steady or faster swims and rides), and each session says how hard it should feel.
- **"How did that feel?" after each cardio session.** Tick a cardio session on Today or Exercise and choose Too easy, About right or Too hard. Two "Too easy" in a row step your cardio up a level; one "Too hard" steps it back. Each session counts once, and every cardio session shows "At your level: ..." straight away, without making a new plan.
  - A heart condition or pregnancy keeps cardio at a steady level, with a note to check with your GP or midwife before going harder. Low energy or chronic pain starts steady and steps up after three "Too easy" in a row. A sore foot, ankle, knee or hip keeps walks as walks.
- **Allergies first.** When nothing in the meal library suits someone's allergies or diet for a meal, the plan now says "Your own choice" instead of giving them the family's meal. Crumbed fish, and fish and chips, are marked as containing egg.
- The plan builder's other fixes from the web: weeks with 3 strength days have all the cardio they promise, the strength-day snack note only names that week's snacks, and Current food makes the shopping cheaper for a family with a budget.

## v0.5.0 (2026-11-12)

Catches up with the web version's changes since v1.8.0:

- **New page: Current food (in More).** List the food already at home, sorted into Pantry, Fridge, Freezer and Other, adding and removing one thing at a time. It replaces the "What's already in your kitchen?" box on Family and plan, which now shows how many things are listed and links to the page. A list typed there before is sorted into the four places the first time it is opened.
  - Where food is kept changes how long it counts: freezer food for the whole 4 weeks, fridge food for as long as it usually keeps, and something from the freezer aisle kept in the fridge for the first week.
  - Fixed: a food on the list could make the plan buy more of it. The builder now stops preferring a food once the meals have used it up.
- **Supplements in About me.** The Health section asks which supplements people already take. An adult's protein powder is counted in their snacks as "Protein shake (1 scoop of your own powder)"; the others add considerations pointing to their GP or pharmacist. For anyone under 18 they are noted and not counted. The plan doesn't suggest starting, stopping or changing any of them.
- **Fasting people already do.** A new About me section covers a daily fast or eating window, set fast days each week, sunrise-to-sunset weeks, and foods given up. Daily fasts change when meals are suggested, not how much food there is; meals someone goes without on a fast day show as "Fast day: no breakfast or lunch." and aren't ticked, rated, counted or shopped for.
- **Suggested eating times** for people who asked for eating reminders.
- Soups count as a mixed texture, a condition typed in "other" reaches the exercise considerations, and written About me answers are listed in the draft's note so they can be checked against the plan.

Not in the app (web only): AI-written plans and the check that they use Current food.

## v0.4.0 (2026-11-10)

Catches up with web v1.5.2 to v1.8.0:

- **Health targets come before likes.** Every plan now aims for each person's serves of vegetables and fruit for their age and sex, children included, after allergies, diets and medicine rules. Safe foods and textures decide the form food comes in; likes and dislikes choose between dishes that already fit. The draft shows how each person's days measure up before you approve it.
- **Each person picks the pace** with a new About me question, "How much should the plan change what you eat?": from week 1, building up over the 4 weeks, or keeping close to what they eat now. A second new question asks what they usually eat in a day.
- **What's already in your kitchen?** A list on Family and plan ("rice 2 kg", "6 eggs"). The next plan uses that food first and leaves it off the shopping lists.
- **Feedback is used.** Dinners someone scored low turn up less often for them, ones they scored high more often, and a logged weight replaces the About me weight for serve sizes.
- **Small steps** for people who aren't keen on vegetables or fruit: one new food to try each week, a short step on from a food they already like, with "Tried it", "Liked it" and "Not this time" on the Meals page.
- **"Likely left over this week"** on the Shopping page.
- **About me shows one section at a time**, with "Show everything on one page" for anyone who prefers that.
- **A fuller look at a draft** before approving: every day's meals, and each person's tips, small steps and considerations. Today shows a banner when a draft is waiting.
- **Your country moved to Settings.**
- 9 more snacks and vegetable sides in the library, and the estimators recognise more foods.
- About me now says plainly that answers stay on this phone.

Not in the app (web only): AI-written plans and their checks, and reading uploaded blood test results.

## v0.3.1 (2026-11-10)

Plan builder fixes from web v1.5.1: foot and ankle injuries are recognised; leg injuries get a swim or bike ride instead of walks; "most veggies" in dislikes means fewer vegetables; children's packed lunches follow their likes and dislikes.

## v0.3.0 (2026-11-10)

Matches web v1.5.0:

- **New question: "Which days does work or school provide lunch?"** Plans don't pack a lunch on those days ("School provides lunch" for children, "Work provides lunch" for adults).
- **"Pool" is now "Pool at home" or "Public pool or swim centre".** Older "Pool" answers still count.
- **New question: "If you use a public pool, which days could you get there?"** Swims go only on those days; other cardio days become walks.

## v0.2.4 (2026-11-10)

Matches web v1.4.5: **snacks are shuffled**, so people and plans get a variety instead of the first few in the library, with snacks matching foods someone loves first. **Rebuild** gives new ones.

## v0.2.3 (2026-11-10)

Catches up with the web version's shared library (`library-community.json`):

- **6 more dishes:** chicken, pumpkin and chickpea tray bake; tuna and sweet potato patties; chicken and corn noodle soup; pork and broccoli rice noodles; ricotta and berry toast; couscous salad with chickpeas and feta.
- **2 more snacks:** edamame and a mandarin; capsicum sticks with hummus.
- **6 more exercises:** band, dumbbell and leg press calf raises, band side steps, single-leg leg press and cable biceps curl.

## v0.2.2 (2026-11-10)

- **10 French dishes** for the plan builder, from web v1.4.4: omelette, French toast, quiche, croque monsieur, niçoise salad, lentil soup, chicken ratatouille, chicken fricassee, salmon parcels and a slow-cooker beef bourguignon. Choosing French in "Kinds of food you'd like more of" now favours them.

## v0.2.1 (2026-11-10)

Matches web v1.4.3: **French** is now in "Kinds of food you'd like more of", and **Cordial** in "What do you usually drink?". Also matches web v1.4.4: choosing **Australian classics** now makes the plan builder favour Australian dishes (it was ignored before).

## v0.2.0 (2026-11-10)

Brings the app up to date with the web version (v1.4.2).

- **Your country:** pick from 22 countries in Family and plan. Plans use that country's currency, shop names, pack sizes and prices, and the shopping links search its supermarkets.
- **Today:** a new front page with each person's meals, exercise and shopping for the day. The account menu is now a **More** tab.
- **Exercise library:** 94 exercises with how-to steps. Plans pick varied workouts to suit each person's equipment, injuries and pregnancy. Leave out exercises you don't want, or **Swap** one in your plan.
- **Gluten-free meals:** the plan builder couldn't make a plan for someone with a wheat or gluten allergy. It now has gluten-free breakfasts and lunches.
- **Names in any alphabet,** like ゆき or 민준.
- Settings open one section at a time; Backup is one of them.
- Fonts now include accented letters (Latin Extended). More → About this app explains that the plan isn't medical advice and that everything stays on the phone.
- Health notes follow the wording rules ("considerations", no "always" or "never").

## v0.1.0 (2026-11-08)

The first version of the standalone app, for testing before the App Store and Google Play.

- Everything is kept on the phone: no accounts, no server, works offline.
- Family and plan: add the people in your family, answer About me for each (including medicines that affect food or exercise), then build and approve a 4-week plan with the built-in plan builder.
- Shopping by aisle with At home, Shop mode and pinned products; Meals and Exercise one day at a time with ticks and ratings; Macros and healthy-eating guidelines; Progress charts with weigh-ins.
- Settings for colours, fonts, text size, stores and kJ or Calories. Save a backup file and restore it, or delete everything.
- Fonts are bundled, so nothing is loaded from the internet.
- Reminders, AI plans and Apple Health / Health Connect come in later versions.
