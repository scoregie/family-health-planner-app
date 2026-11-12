# Changelog

Each version is tagged on GitHub (see Releases) with these notes.

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
