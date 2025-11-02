# Platform Feature TODO List

## 🚨 Critical (Must Fix Before Merge)

These issues will cause bugs in production and must be fixed before merging:

- [x] **Fix URL serialization regex bug** (`src/lib/model/keymap-utils.ts:4`)
  - Change `replaceAll("\w", "-")` to `replace(/[^\w-]+/g, "-")`
  - Bug causes "Windows" → "windo-s" in URLs
  - File: `src/lib/model/keymap-utils.ts`

- [x] **Add platform field to parser** (`src/lib/load/input-parser.ts:16`)
  - Platform field is currently dropped during parsing
  - Add `platform: inputKeymap.platform,` to the mapper
  - File: `src/lib/load/input-parser.ts`

- [x] **Fix failing test** (`src/lib/load/input-parser.spec.ts:11`)
  - Test expects `Modifiers.command` but gets `Modifiers.control` due to platform detection
  - Mock platform detection or use explicit modifiers in test
  - File: `src/lib/load/input-parser.spec.ts`

- [x] **Add platform enum validation** (`src/lib/load/validator.ts`)
  - Validate that platform values are in ['windows', 'linux', 'macos']
  - Reject invalid values like "", null, "invalid"
  - File: `src/lib/load/validator.ts`

---

## ⚠️ High Priority (Should Fix Soon)

These issues affect code quality and maintainability:

- [ ] **Add platform field preservation test** (`src/lib/load/input-parser.spec.ts`)
  - Test that platform field is preserved when parsing shortcuts
  - Verify all three platform values work correctly
  - File: `src/lib/load/input-parser.spec.ts`

- [ ] **Add platform validation tests** (`src/lib/load/validator.spec.ts`)
  - Test valid platform values are accepted
  - Test invalid platform values are rejected
  - Test null/undefined/empty string handling
  - File: `src/lib/load/validator.spec.ts`

- [ ] **Create keymap serialization tests** (NEW FILE)
  - Create `src/lib/model/keymap-utils.spec.ts`
  - Test `serializeKeymap` with and without platform
  - Test special characters in keymap titles
  - Test all three platforms
  - File: `src/lib/model/keymap-utils.spec.ts` (new)

- [x] **Remove code duplication** (`getPlatformDisplay` helper)
  - Extract `getPlatformDisplay` to shared utility
  - Remove from `app-details.tsx:28-41`
  - Remove from `keymap-selector.tsx:17-30`
  - Create `src/lib/utils/platform.ts` or add to `src/lib/utils.ts`
  - Update imports in both files

- [x] **Add accessibility labels to platform badges**
  - Add aria-label to Badge in `app-details.tsx:190-194`
  - Add aria-label to Badge in `keymap-selector.tsx:50-53` and `66-69`
  - Example: `aria-label="Platform: Windows"`

---

## 📝 Medium Priority (Nice to Have)

These improvements enhance the feature but aren't blocking:

### Testing

- [ ] **Add platform badge rendering tests**
  - Test Badge component shows correct platform name
  - Test Badge is hidden when platform is undefined
  - Verify all three platforms render correctly

- [ ] **Add platform detection logic tests**
  - Test `getPlatform()` function in `modifiers.ts`
  - Mock navigator.userAgent for Windows/Linux/macOS
  - Test caching mechanism
  - Test SSR fallback

- [ ] **Add end-to-end platform tests**
  - Test navigation to platform-specific keymaps
  - Test URL structure with platforms
  - Test platform badge visibility in UI

### Documentation

- [ ] **Document platform routing in README**
  - Explain URL structure: `/apps/{slug}/{title}-{platform}`
  - Show examples of URLs with platforms
  - Document how multiple keymaps with platforms work

- [ ] **Add migration guide for existing apps**
  - Document how to add platform support to existing shortcuts
  - Provide step-by-step instructions
  - Include before/after examples

- [ ] **Document when to use platform vs separate apps**
  - Guidelines for when platform field is appropriate
  - Examples of good use cases (VS Code, IntelliJ)
  - Examples of when separate apps are better

### Code Quality

- [x] **Extract shared Platform type**
  - Create `export type Platform = 'windows' | 'linux' | 'macos'`
  - Use throughout codebase for consistency
  - Update all interfaces to use shared type

- [x] **Fix SSR hydration issue** (`modifiers.ts:35-36`)
  - Platform detection at module load can cause hydration mismatch
  - Create `usePlatform()` hook for client-side detection
  - Document server vs client platform handling
  - File: `src/lib/hooks/use-platform.ts` (new)

- [x] **Add `isMacOS` export for consistency**
  - Currently have `isWindows` and `isLinux` but not `isMacOS`
  - Add for API consistency
  - File: `src/lib/model/internal/modifiers.ts`

### Features

- [x] **Add platform auto-selection**
  - When user visits app page, auto-select keymap for their platform
  - If no platform match, select first keymap
  - Consider user preference override

- [ ] **Add platform filtering UI**
  - Allow users to filter keymaps by platform
  - Show/hide platform-specific keymaps
  - Remember user preference

- [ ] **Add platform indicators on app list**
  - Show which platforms are supported on main app list
  - Use small badges or icons
  - Help users discover cross-platform apps

- [ ] **Add platform support to more apps**
  - IntelliJ IDEA (Windows/Linux have different defaults)
  - Chrome/Firefox (minor differences exist)
  - Obsidian (cross-platform)
  - Review all 32 apps for platform opportunities

### Build/Export

- [ ] **Add validation to export process**
  - Validate platform values in `combineApps()`
  - Prevent invalid data from being exported
  - File: `src/lib/write/app-writer.ts`

---

## 📊 Current Status

- **Schema**: ✅ Complete
- **Types**: ✅ Complete
- **Data Files**: ✅ Complete (18 files with platform field)
- **UI Display**: ✅ Complete (platform badges)
- **URL Routing**: ✅ Fixed
- **Data Parsing**: ✅ Fixed
- **Validation**: ✅ Complete
- **Platform Auto-Selection**: ✅ Complete
- **Tests**: ⚠️ Partial (need platform-specific tests)

**Overall Implementation**: 90% complete

---

## 🎯 Recommended Workflow

1. **Week 1 - Critical Issues**: Fix all 4 critical items
2. **Week 2 - Testing**: Add comprehensive test suite (high priority items)
3. **Week 3 - Quality**: Remove duplication, add accessibility
4. **Week 4 - Features**: Add auto-selection and filtering

---

## Notes

- All critical issues are isolated and straightforward to fix
- Estimated time for critical fixes: 2-3 hours
- Estimated time for high priority: 4-6 hours
- Medium priority items can be done incrementally

---

*Last updated: 2025-11-02*
