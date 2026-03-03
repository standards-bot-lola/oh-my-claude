# Skill: Add Environmental Data

Use this skill when adding new dietary profiles, updating CO2 constants, or extending the environmental comparison model.

## Where Things Live

- **Dietary profiles:** `js/config.js` → `TD.DIET_PROFILES`
- **Energy/CO2 constants:** `js/config.js` → `TD.ENV_TIERS`
- **Burger constants:** Also in `TD.ENV_TIERS` (KG_CO2_PER_BURGER, AVG_BURGERS_PER_WEEK)
- **Diet computation:** `js/engine.js` → `TD.computeDietProfileTier()` and `TD.computeDietProfile()`
- **Burger computation:** `js/engine.js` → `TD.computeBurgerTier()` and `TD.computeBurger()`
- **Rendering:** `js/app.js` → `renderBurgerTier()` (the big HTML builder)

## Adding a New Dietary Profile

1. Add an entry to `TD.DIET_PROFILES` in `js/config.js`:
   ```js
   flexitarian: {
     label: 'Flexitarian',
     desc: 'Mostly plant-based, occasional meat',
     kgCO2PerDay: { conservative: 2.5, moderate: 3.0, generous: 4.5 }
   },
   ```

2. The key (e.g., `flexitarian`) is used as the localStorage value and in `savingsVerbs` in `app.js`.

3. Update the `savingsVerbs` object in `renderBurgerTier()` in `js/app.js`:
   ```js
   var savingsVerbs = {
     pescatarian: 'choosing fish over meat',
     vegetarian: 'going vegetarian',
     vegan: 'going vegan',
     flexitarian: 'going flexitarian',  // ← add this
   };
   ```

4. No changes needed in `engine.js` — `computeDietProfileTier()` reads profiles dynamically.

5. The profile selector buttons are generated from `TD.DIET_PROFILES` keys automatically.

## Updating Energy Constants

Each tier in `TD.ENV_TIERS` has:
- `KWH_PER_MTOK_OUTPUT` — Energy per million output tokens
- `KWH_PER_MTOK_INPUT` — Energy per million input tokens
- `KWH_PER_MTOK_CACHE_READ` — Energy per million cache read tokens
- `KG_CO2_PER_KWH` — Grid carbon intensity

These feed into both the burger and diet profile computations via `TD.getEnv(tier)`.

## Sourcing Requirements

All environmental constants MUST have peer-reviewed or government sources. Update the methodology `<details>` section in `renderBurgerTier()` in `js/app.js` when changing any values. The 3-tier system exists specifically to capture measurement uncertainty — don't collapse it to a single number.
