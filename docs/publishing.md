# Publishing to the App Store and Google Play

A checklist for getting the app into both stores. The steps marked **(you)** need the developer's own accounts and can't be automated.

## 1. Developer accounts (you)

- **Apple Developer Program:** https://developer.apple.com/programs/ ($99 USD a year). Enrol as an individual, or as an organisation (needs a D-U-N-S number). Approval can take a few days.
- **Google Play Console:** https://play.google.com/console ($25 USD once). Google checks your identity.
  - New **personal** accounts must run a **closed test with at least 12 testers for 14 days in a row** before the app can be published to everyone. Organisation accounts don't have this rule.

## 2. Android signing

Google Play signs the app for users ("Play App Signing"); you sign uploads with your own **upload key**.

1. Make the upload key once (keep this file and its passwords safe, and never commit them):

       keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000

2. In this GitHub repo, open **Settings → Secrets and variables → Actions** and add:
   - `ANDROID_KEYSTORE_BASE64`: the file, encoded with `base64 -w0 upload.jks`
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`upload`), `ANDROID_KEY_PASSWORD`
3. The next build makes a signed `.aab` (an artifact on the Actions run, and attached to releases).

## 3. iOS signing (you, then GitHub)

1. In App Store Connect, create the app with the bundle ID **io.github.scoregie.familyhealthplanner** (register it under Certificates, Identifiers & Profiles first).
2. Make an **Apple Distribution** certificate and an **App Store** provisioning profile for that bundle ID.
3. Make an **App Store Connect API key** (Users and Access → Integrations) so GitHub can upload builds to TestFlight.
4. Add these GitHub secrets: `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_BASE64`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_P8`.
   The signed-build workflow will be added once the account exists (it can't be tested before then).

## 4. The privacy policy page

Both stores need a public privacy policy. Turn on GitHub Pages (**Settings → Pages → Deploy from a branch → main, /docs**). The policy is then at https://scoregie.github.io/family-health-planner-app/privacy.html.

## 5. Store listings

Copy the text from [store/listing.md](../store/listing.md). Take screenshots on the simulator or emulator at the listed sizes.

## 6. Testing, then review

- **Google:** upload the `.aab` to **Internal testing** first (instant, up to 100 testers), then a **Closed test** (12+ testers for 14 days for new personal accounts), then apply for **Production**.
- **Apple:** upload with the workflow (or Xcode → Product → Archive), test with **TestFlight**, then **Submit for Review**. Apple's review usually takes 1 to 3 days.

Things reviewers check for this kind of app:

- Health wording: no claims to diagnose, treat or cure. The app says it is general information and to check with a GP.
- The privacy policy and privacy answers match what the app does (nothing is collected).
- The app works fully offline, without an account: give reviewers a note saying there is no login.

## 7. Releasing an update

1. Update `CHANGELOG.md`, and bump the version in `package.json`, `android/app/build.gradle` (`versionName`, and `versionCode` + 1) and Xcode (`MARKETING_VERSION`, and `CURRENT_PROJECT_VERSION` + 1).
2. Merge to `main`, then tag: `gh release create vX.Y.Z --notes-file <notes>`.
3. Upload the new builds to each store.
