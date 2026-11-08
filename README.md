# Family Health Planner (app)

An iPhone and Android app that plans a family's meals, shopping and exercise together. Add the people in your family, answer some questions about each of them, and the app builds a 4-week plan that fits everyone: meals and recipes, a shopping list for each week, snacks, and an exercise plan for each person.

Everything is kept **on the phone**. There are no accounts, no server and no tracking, and the app works without the internet.

> This is the standalone app. The self-hosted web version, which a whole family shares from their own server (with logins, AI and Apple Health sync), is a separate project: [family-meal-planner](https://github.com/scoregie/family-meal-planner).

**Status:** v0.1, being prepared for the App Store and Google Play. See [CHANGELOG.md](CHANGELOG.md).

## What it does

- **Family and plan:** add everyone the plan is for (adults and kids) and answer the **About me** questions for each person: goals, health (including medicines that affect food or exercise), allergies and diets, foods they won't eat, cooking time, kitchen, budget, exercise and support needs.
- **The plan builder** picks meals from a built-in recipe library to fit everyone. It leaves out allergens and anything outside someone's diet, gives someone their own dinner when the family's doesn't suit them, sizes portions for each person, uses leftovers for lunches, and builds a gentle exercise plan for the equipment they have. Nothing changes until you approve the plan.
- **Shopping:** a list for each week by supermarket aisle, with prices, **At home**, **Shop mode** (one item at a time) and links to search Coles, Woolworths and other stores. You can pin the exact product you buy.
- **Meals and Exercise:** one day at a time for each person, with recipes, ticks and ratings out of 10.
- **Macros and guidelines:** each person's week compared with official healthy-eating guidelines (Australia, New Zealand, UK, Japan or Korea), in kilojoules or Calories.
- **Progress:** weekly charts of weight, meals, food energy and exercise.
- **Settings and backup:** light or dark, colours, fonts and text size; save a backup file and restore it on another phone.

It's a planning tool, not medical advice. The app asks people to check their plan with their GP, dietitian or physio, and health notes are written as considerations to check, not instructions. Prices are rough Australian supermarket estimates.

## How it's built

- [Capacitor](https://capacitorjs.com) 8 wraps the web pages in `www/` as native iOS and Android apps.
- The pages were written for the self-hosted server and call addresses like `/api/state`. In the app, `www/local-api.js` answers those calls on the phone and keeps everything in one JSON file in the app's private storage.
- The plan builder (`www/planbuilder.js`) and meal library (`www/library.json`) are shared with the web version. `tools/build_library.py` rebuilds the library.
- The fonts are bundled in `www/fonts/`, so nothing is loaded from the internet.

## Building it yourself

You need Node.js 22 or newer. For Android, [Android Studio](https://developer.android.com/studio). For iPhone, a Mac with [Xcode](https://developer.apple.com/xcode/) 16 or newer.

    npm install
    npx cap sync
    npx cap open android     # or: npx cap open ios

Then press Run in Android Studio or Xcode. After changing anything in `www/`, run `npx cap sync` again.

To try the pages in an ordinary browser, serve `www/` with any static web server (for example `npx http-server www`). In a browser, data is kept in localStorage instead of a file.

Icons and splash screens come from `assets/` (made from `www/logo.svg`). To make them again: `npx @capacitor/assets generate --iconBackgroundColor "#0e6b57" --splashBackgroundColor "#f5f5f4" --splashBackgroundColorDark "#121214"`.

## Automatic builds and releases

GitHub Actions (in `.github/workflows/`) builds the app for every change:

- **Android:** a test APK you can install straight onto a phone, and an app bundle (`.aab`) for Google Play. If the signing secrets are set (see [docs/publishing.md](docs/publishing.md)), the bundle is signed for upload.
- **iOS:** a build for the iPhone simulator, which checks it compiles. Signed builds for TestFlight and the App Store need the Apple signing secrets.

Each version is published as a [release](https://github.com/scoregie/family-health-planner-app/releases) with notes, and the Android test APK is attached to it.

## Publishing to the App Store and Google Play

See [docs/publishing.md](docs/publishing.md) for the step-by-step checklist (developer accounts, signing, store listings and review), and [store/listing.md](store/listing.md) for the store text. The privacy policy is [PRIVACY.md](PRIVACY.md) (also published at the project's GitHub Pages site).

## Licence and credits

[MIT](LICENSE).

- Nutrition data: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov. SR Legacy data, public domain (CC0 1.0).
- Fonts: Atkinson Hyperlegible, Lexend, Nunito and Literata, under the SIL Open Font License 1.1 (see `www/fonts/LICENSES.txt`), from [Fontsource](https://fontsource.org).
- Recipes are written for this project.
