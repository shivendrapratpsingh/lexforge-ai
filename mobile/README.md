# LexForge AI — Mobile (React Native / Expo)

This is a runnable Expo app built from the LexForge AI React Native design
handoff. It's wired up, type-checked, and bundle-tested — not just a set of
files to copy in.

## Run it on your phone

1. Install [Expo Go](https://expo.dev/go) from the App Store / Play Store on
   your phone.
2. On your computer, inside this folder:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code that appears in the terminal:
   - iPhone: scan it with the Camera app, then tap the banner.
   - Android: scan it from inside the Expo Go app.

Your phone and computer need to be on the same Wi-Fi network. If the QR code
doesn't connect (e.g. on restrictive networks), run `npx expo start --tunnel`
instead.

## Run on a simulator/emulator

```bash
npm run ios       # requires Xcode + iOS Simulator (Mac only)
npm run android   # requires Android Studio + an emulator/device
```

## What's in the app

All 24 screens from the design handoff (auth, dashboard, new draft flow,
drafts list/editor, clients, court dates, legal tools, research, future
lawyer/study, admin console, settings) plus the floating AI Case Assistant,
built with the exact dark/gold LexForge design system (`src/theme/theme.ts`).
English + Hindi are both wired up via i18next (`src/i18n/`).

Everything currently renders from in-memory sample data
(`src/data/docTypes.ts`, `src/data/sampleDrafts.ts`, and small hardcoded
arrays at the top of each list screen) so you can try every screen
immediately. Swap those for real API calls when you connect the backend —
each spot is commented.

## What was fixed to make this run

The design handoff was high-fidelity UI code but hadn't been installed,
type-checked, or bundled before. To get it running smoothly on-device, this
pass:

- Scaffolded a real Expo/TypeScript project and installed every dependency
  the handoff's README called for, plus two it was missing on current
  package versions: `react-native-worklets` (Reanimated 4 moved its Babel
  plugin here) and `buffer` (a transitive dependency `react-native-svg`
  needs at bundle time).
- Bumped `react-native-gesture-handler` to a version compatible with React
  Native 0.86's New Architecture (the version the README listed predates it
  and fails to bundle).
- Fixed ~20 TypeScript errors: a handful of screens (Dashboard, Drafts list,
  Court Dates, Draft detail, Client detail) are mounted inside nested tab
  stacks under different route names than their prop types assumed — typed
  those navigation props pragmatically rather than rebuilding the nested
  param-list types, since it doesn't change any runtime behavior. Also fixed
  a `useRef` missing its initial value, a couple of `DimensionValue` typing
  issues, an outdated `StyleSheet.absoluteFillObject` reference, and the
  React Navigation v7 theme type needing a `fonts` field.
- Verified the whole thing actually compiles and bundles (`tsc --noEmit`
  clean, `expo export` bundles ~1,800 modules successfully) rather than just
  reading clean.
- Confirmed the New Architecture is enabled (`app.json` → `newArchEnabled`),
  which Reanimated 4 requires, and that fonts fully load before first paint
  so there's no flash of fallback fonts on launch.

## Performance notes

- `DraftsListScreen` and `CourtDatesScreen` already use `FlatList`; keep that
  pattern when you wire real (potentially large) data into `ClientsScreen`
  and `AdminScreen`, which currently `.map()` over small fixed sample arrays.
- All shimmer/pulse/streaming-caret animations run through Moti/Reanimated
  (UI-thread, native driver) and respect the `reducedMotion` flag in
  `src/store/useAppStore.ts`, wired to the Settings toggle.
- For real swipe-to-reveal actions on the Drafts list and true drag-to-dismiss
  bottom sheets, see the notes already in the handoff's original README
  section below.

---

# LexForge AI — React Native Handoff

Real Expo/React Native/TypeScript source for the LexForge AI mobile app, generated from
a fully interactive high-fidelity prototype built earlier in this project
(`LexForge Mobile.dc.html` — open it to see every screen live and tap through the flows).

## Fidelity

**High-fidelity.** Every color, font, radius, shadow and spacing value below matches the
approved design system exactly (see `theme/theme.ts`). Copy, layout structure and
interaction flow match the prototype screen-for-screen. Treat this as implementation-ready
code, not a wireframe — the goal is to drop it into your app with minimal rework.

## How to merge this into your existing app

This is **not a standalone project to run as-is** — it's a set of files meant to be copied
into your existing Expo/React Native app's source tree, preserving its folder layout:

1. Copy `theme/`, `i18n/`, `components/`, `navigation/`, `screens/`, `store/`, and `data/`
   into your app's `src/` (or wherever your source lives). If you already have a `theme`,
   `store`, or `i18n` setup, merge the contents of `theme.ts` / `useAppStore.ts` / the i18n
   resources into your existing files instead of overwriting them.
2. Install dependencies (see below).
3. Wire `navigation/RootNavigator.tsx` into wherever your app currently mounts its top-level
   navigator — or use `App.tsx` here as a reference for the full boot sequence (fonts → i18n
   → SafeAreaProvider → ToastProvider → RootNavigator).
4. Replace the in-memory sample data (`data/docTypes.ts`, `data/sampleDrafts.ts`, and the
   hardcoded arrays at the top of each list screen) with real API calls / your data layer.
   Every screen that reads sample arrays has a comment marking what to swap.
5. `store/useAppStore.ts` is a minimal Zustand stub for `isAuthed` / `isPro` / `isAdmin` /
   `reducedMotion`. If you already have an auth/session store, point the screens at that
   instead — they only read those four fields plus `userName`/`userEmail`.

## Dependencies to install

```bash
npx expo install expo-font expo-linear-gradient expo-blur expo-localization expo-splash-screen expo-status-bar
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install react-native-svg
npx expo install react-native-svg
npm install moti react-native-reanimated
npx expo install react-native-reanimated
npm install zustand
npm install i18next react-i18next
npm install @react-native-masked-view/masked-view
npx expo install @react-native-masked-view/masked-view

# Fonts (verify exact package names on npm — @expo-google-fonts publishes one package
# per family; naming follows the family name, kebab-cased):
npm install @expo-google-fonts/source-serif-4 @expo-google-fonts/noto-serif-devanagari @expo-google-fonts/hind
```

Also add the Reanimated Babel plugin to `babel.config.js` (last in the plugins array) per
the `react-native-reanimated` install docs, if it isn't already there.

## What's included

| Path | Contents |
|---|---|
| `theme/theme.ts` | Every color, gradient, font, radius, spacing, shadow token. Import this everywhere instead of hardcoding values. |
| `i18n/` | `en.json`, `hi.json` resource files + `i18next` bootstrap (`index.ts`). Mirrors the web app's next-intl en/hi setup. |
| `components/` | Button, Card, Badge, Field, BottomSheet, NavItem, SkeletonLoader, StreamingText (+ GeneratingLivePill), EmptyState, Toast, GradientText, GlassPanel, AssistantChat |
| `navigation/` | `types.ts` (param lists), `AuthStack.tsx`, `BottomTabs.tsx` (custom tab bar + gold FAB), `MoreSheet.tsx`, `TabletRail.tsx` (tablet/landscape left rail), `RootNavigator.tsx` |
| `store/useAppStore.ts` | Zustand store for auth/session flags |
| `data/` | `docTypes.ts` (all 19 document types), `sampleDrafts.ts` (sample generated content) |
| `screens/` | All screens listed below |
| `App.tsx` | Reference boot sequence (fonts, i18n, providers) |

### Screens

**Full visual polish** (the 6 called out as most important):
Login, Dashboard, New Draft picker (`screens/NewDraft/DocTypePickerScreen.tsx`), Draft
detail/editor, Upgrade/Pro, AI Case Assistant (`components/AssistantChat.tsx`).

**Also fully built**, matching the prototype's structure and copy: Register, Forgot
Password, Reset Password, New Draft intake form, New Draft generating (streaming text +
caret), New Draft result, Drafts list, Clients + Client detail, Court Dates (+ add-reminder
sheet), Legal Tools + tool detail, Research, Future Lawyer hub + Moot Court + Q&A Drills +
Study Roadmap, Admin Console (expandable data cards), Settings.

## Navigation structure

- Bottom tab bar (custom, in `BottomTabs.tsx`): Dashboard, Drafts, **New Draft** (elevated
  gold-gradient FAB — intercepts the tab press and pushes the New Draft stack instead of
  rendering a tab screen), Court Dates, More (intercepts the tab press and opens
  `MoreSheet`, a bottom sheet, instead of navigating).
- Each bottom-tab hosts its own nested native-stack so drill-ins (e.g. Dashboard →
  DraftDetail) push correctly within that tab.
- `MoreSheet` (bottom sheet): Clients, Legal Tools (PRO badge if not Pro), Research (PRO
  badge if not Pro), Future Lawyer, Admin Console (admin only), language switcher, upgrade
  banner, sign out.
- `TabletRail.tsx` is provided for the tablet/landscape persistent left rail described in
  the brief — swap it in for `BottomTabs` when `useWindowDimensions().width > 768` (or
  your preferred breakpoint); wire `RootNavigator.tsx` to pick between them.
- `AssistantChat` and `MoreSheet` are mounted as siblings of the stack navigator in
  `RootNavigator.tsx` so they float above whatever screen is active, matching the
  always-available floating assistant bubble behavior.

## Signature visual effects — implementation notes

- **Gradient gold text**: `components/GradientText.tsx` via `@react-native-masked-view/masked-view` + `expo-linear-gradient`.
- **Glass panels**: `components/GlassPanel.tsx` via `expo-blur`. Used by `AssistantChat`.
- **Card press/selected state**: `components/Card.tsx` — border shifts to gold + lift + glow via Moti.
- **Shimmer skeleton**: `components/SkeletonLoader.tsx` — animated gradient sweep via Moti + `expo-linear-gradient`; renders a static block when `reducedMotion` is true.
- **Streaming text + caret**: `components/StreamingText.tsx` — feed it a growing `text` prop from your real generation stream; the caret blinks via Moti and is a static glyph under reduced motion.
- **"Generating live…" pill**: `GeneratingLivePill` in the same file.
- **Animated gradient border**: `UpgradeScreen.tsx`'s `GradientBorderCard` — a rotating `LinearGradient` behind a padded inner card; becomes a static gradient under reduced motion.
- **Reduced motion**: every animated component takes a `reducedMotion` prop (or reads `useAppStore().reducedMotion`) and swaps to a static equivalent — wire this to the Settings toggle already built.

## Deviations from the web app (and why)

- **Swipe actions on Drafts list**: the prototype simulates swipe with a tap-to-reveal
  action row for speed. For real swipe-to-reveal (clone/export/delete), wrap each row in
  `react-native-gesture-handler`'s `Swipeable` — noted inline in `DraftsListScreen.tsx`.
- **Bottom sheet gestures**: `components/BottomSheet.tsx` covers tap-backdrop-to-dismiss +
  slide animation, not drag-to-dismiss. Swap in `@gorhom/bottom-sheet` if you want native
  drag physics — the API surface (visible/onClose/children) is deliberately close to that
  library's so the swap is mechanical.
- **Two-layer card shadow**: the web design's tight+diffuse dual box-shadow has no direct
  RN equivalent (native shadows are single-layer). `theme.shadows.card` approximates it
  with one larger, softer shadow.
- **Paragraph-level draft editing**: `DraftDetailScreen.tsx` renders each paragraph as a
  pressable block (structure is there); wire actual inline editing (focus → TextInput swap,
  or a rich-text editor) to your content model.
- **Calendar view for Court Dates**: shipped as a list (matches the prototype); swap for
  `react-native-calendars` if you want month-grid view too.
- **Icons**: simple inline `react-native-svg` paths/shapes throughout rather than a full
  custom icon set — swap in your icon library of choice (e.g. Phosphor, Feather) for
  production polish.
- **Font packages**: `@expo-google-fonts/*` package names are assumed to follow the
  standard naming convention; verify exact availability/weights on npm before installing,
  particularly for Noto Serif Devanagari's weight range.
- **NativeWind**: the original brief offered NativeWind or a centralized theme file. This
  handoff uses plain `StyleSheet` + `theme.ts` so it drops into any existing app regardless
  of styling setup. If your app uses NativeWind, mirror `theme.ts`'s values into
  `tailwind.config.js` and translate the `StyleSheet.create` blocks to className strings —
  the values themselves don't change.

## Design reference

For the full interactive spec (every screen, every state, both languages, both device
frames, Free/Pro toggle), open `LexForge Mobile.dc.html` in this project — it's the source
of truth this code was written from.
