# Website Sizing Changes - Task List

## Objective
Increase the default appearance size of the website to approximately 135% of current size for better readability on desktop displays, while maintaining full accessibility compliance.

## Current State Analysis

### Base Configuration
- **Base font size:** `14px` (globals.css:72)
- **Main content container:** `max-w-lg` = `512px` (BaseLayout.astro:44)
- **Target effective size:** 135% zoom equivalent

### Calculated Target Sizes
- **Target font size:** ~18.9px (14px × 1.35) → rounds to **18-19px**
- **Target content width:** ~691px (512px × 1.35) → use **768px** (`max-w-md`)
- **Relationship to breakpoints:**
  - Current: 512px (sits below `sm: 640px`)
  - Target: 691px (between `sm: 640px` and `md: 768px`)
  - Recommended: 768px (`max-w-md` or `max-w-2xl`)

### Tailwind Configuration
**Current breakpoints** (tailwind.config.ts):
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
3xl: 1920px
```

**Max-width utilities:**
- `max-w-lg`: 512px (current)
- `max-w-xl`: 640px
- `max-w-2xl`: 768px (recommended target)
- `max-w-3xl`: 896px
- `max-w-4xl`: 1024px

## Implementation Strategy

### Option A: Responsive Font Scaling (Recommended)
Scale base font size based on viewport, keeping content width responsive.

**Advantages:**
- ✅ Maintains accessibility (browser zoom still works)
- ✅ Better typography control
- ✅ Mobile unaffected
- ✅ WCAG compliant

**Implementation:**
1. Update base font size from 14px to 16px (WCAG recommended minimum)
2. Add responsive scaling for larger viewports
3. Adjust content container width
4. Test all breakpoints

### Option B: Static Larger Sizes
Simply increase base sizes across all viewports.

**Advantages:**
- ✅ Simpler implementation
- ✅ Consistent across devices

**Disadvantages:**
- ⚠️ May be too large on mobile
- ⚠️ Less flexible

## Detailed Task Breakdown

### Phase 1: Analysis & Planning
- [x] Document current sizing configuration
- [x] Calculate target sizes
- [x] Identify affected files
- [x] Review Tailwind configuration
- [ ] Audit all layout components for hard-coded sizes
- [ ] Identify components using font-size utilities
- [ ] Check for viewport-dependent layouts that might break

### Phase 2: Core Changes

#### Task 2.1: Update Base Font Size
**File:** `src/styles/globals.css`

**Current:**
```css
html {
  font-size: 14px;
}
```

**Proposed Change:**
```css
html {
  font-size: 16px; /* WCAG recommended minimum */
}

/* Scale up for larger viewports */
@media (min-width: 1024px) {
  html {
    font-size: 18px; /* ~129% increase */
  }
}

@media (min-width: 1280px) {
  html {
    font-size: 19px; /* ~136% increase - matches target */
  }
}
```

**Accessibility Impact:** ✅ Positive - meets WCAG 2.1 AA minimum
**Browser Zoom Impact:** ✅ None - zoom still works independently

#### Task 2.2: Update Main Content Container
**File:** `src/layouts/BaseLayout.astro`

**Current (line 44):**
```html
<div class="flex flex-col max-w-lg mx-auto md:py-6 space-y-0">
```

**Proposed Change:**
```html
<div class="flex flex-col max-w-2xl mx-auto md:py-6 space-y-0">
```

**Impact:**
- Changes from 512px → 768px (50% wider)
- Combined with 18-19px font = ~135% visual effect
- Still responsive on mobile (mx-auto centers, max-w prevents overflow)

**Alternative Options:**
- `max-w-xl` (640px) - More conservative, 25% increase
- `max-w-3xl` (896px) - More aggressive, 75% increase

#### Task 2.3: Review Typography Plugin Settings
**File:** `tailwind.config.ts`

**Check:** Does the `@tailwindcss/typography` plugin need configuration updates?
- Review prose sizing
- Check heading scales
- Verify code block sizing
- Test list spacing

### Phase 3: Component Audit

#### Task 3.1: Header Components
**Files to check:**
- `src/components/Header/PreHeader.astro`
- `src/components/Header/Navbar/NavBar.astro`

**Look for:**
- Hard-coded text sizes (`text-sm`, `text-xs`, etc.)
- Fixed heights that might break
- Logo sizing
- Navigation spacing

#### Task 3.2: Footer Component
**File:** `src/components/Footer/Footer.astro`

**Look for:**
- Text sizing utilities
- Icon sizes
- Link spacing
- Copyright text size

#### Task 3.3: Content Layouts
**Files to check:**
- `src/layouts/PostLayout.astro`
- `src/layouts/BaseLayout.astro` (already identified)
- Any other layout files in `src/layouts/`

**Look for:**
- Content width constraints
- Sidebar sizing (if any)
- Grid/flex gaps that might need adjustment
- Padding/margin that scales with font-size

#### Task 3.4: Card Components
**Files to check:**
- Blog post cards
- Project cards
- Tech cards
- Client cards

**Look for:**
- Card dimensions
- Image aspect ratios
- Text truncation (might need adjustment)
- Button sizes

#### Task 3.5: Forms & Inputs
**Files to check:**
- Contact forms
- Search inputs
- Any form components

**Look for:**
- Input heights (should be >= 44px for WCAG)
- Button sizes (touch targets)
- Label sizing
- Error message sizing

### Phase 4: Testing Checklist

#### 4.1: Visual Testing
- [ ] Homepage at all breakpoints (mobile, tablet, desktop, xl)
- [ ] Blog listing page
- [ ] Individual blog post
- [ ] Projects page
- [ ] Tech pages
- [ ] Contact/forms
- [ ] Navigation (mobile & desktop)
- [ ] Footer

#### 4.2: Accessibility Testing
- [ ] Browser zoom works (test 100%, 150%, 200%)
- [ ] Text remains readable at all sizes
- [ ] Touch targets >= 44×44px (WCAG 2.1 AA)
- [ ] No horizontal scrolling at 320px width
- [ ] Contrast ratios maintained
- [ ] Screen reader testing (basic)

#### 4.3: Responsive Testing
- [ ] Mobile (320px, 375px, 414px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1280px, 1440px, 1920px)
- [ ] Ultra-wide (2560px+)

#### 4.4: Content Testing
- [ ] Long headings don't break layout
- [ ] Long words wrap correctly
- [ ] Code blocks remain readable
- [ ] Images scale appropriately
- [ ] Tables remain functional
- [ ] Lists have proper spacing

#### 4.5: Component Testing
- [ ] Navigation menu (desktop & mobile)
- [ ] Modals/dialogs (if any)
- [ ] Carousels/sliders
- [ ] Galleries
- [ ] Cards maintain aspect ratios
- [ ] Buttons remain properly sized

### Phase 5: Fine-tuning

#### Task 5.1: Typography Adjustments
After initial implementation, review:
- [ ] Heading hierarchy (h1-h6) feels balanced
- [ ] Paragraph line-height comfortable (1.5-1.75 recommended)
- [ ] Code block font size readable
- [ ] Quote block sizing
- [ ] Caption text appropriately smaller

#### Task 5.2: Spacing Adjustments
- [ ] Section spacing feels balanced
- [ ] Card gaps appropriate
- [ ] Navigation spacing comfortable
- [ ] Footer spacing proportional

#### Task 5.3: Container Adjustments
- [ ] Consider if different pages need different max-widths
- [ ] Blog posts might benefit from narrower width (readability)
- [ ] Home/landing pages might want wider
- [ ] Document optimal reading width: 45-75 characters per line

### Phase 6: Documentation

#### Task 6.1: Update Project Documentation
- [ ] Document new base font sizes in CLAUDE.md
- [ ] Update any design system docs
- [ ] Note breakpoint usage patterns
- [ ] Document typography scale

#### Task 6.2: Create Migration Notes
- [ ] Document what changed and why
- [ ] Note any breaking changes
- [ ] List components that needed adjustment
- [ ] Record accessibility improvements

## Risk Assessment

### Low Risk ✅
- Increasing base font size to 16px (standard practice)
- Widening content container within breakpoint limits
- Adding responsive font scaling

### Medium Risk ⚠️
- Components with hard-coded dimensions might break
- Images might need aspect ratio adjustments
- Third-party components might not scale well
- Mobile layouts might need tweaking

### High Risk ❌
- None identified (changes are reversible and incremental)

## Rollback Plan

If issues arise:
1. Revert `src/styles/globals.css` font-size changes
2. Revert `BaseLayout.astro` max-width change
3. Test in dev environment before pushing to production
4. Use git to restore previous state if needed

```bash
git checkout HEAD~1 -- src/styles/globals.css src/layouts/BaseLayout.astro
```

## Success Metrics

### Visual
- ✅ Site appears ~35% larger on desktop (1280px+ viewports)
- ✅ Text more readable without browser zoom
- ✅ Layout remains balanced and not cramped
- ✅ No horizontal scrolling on any viewport

### Accessibility
- ✅ Passes WCAG 2.1 AA compliance
- ✅ Browser zoom works independently (200%+ zoom)
- ✅ Touch targets >= 44px
- ✅ Maintains contrast ratios

### Technical
- ✅ No console errors
- ✅ No layout shifts or breaks
- ✅ Mobile performance unchanged
- ✅ Build process successful

## Next Steps

1. **Review this task list** - Confirm approach is sound
2. **Component audit** - Identify all files that need checking
3. **Implement core changes** - Start with globals.css and BaseLayout
4. **Test incrementally** - Check dev site after each change
5. **Iterate** - Fine-tune based on testing feedback
6. **Deploy to production** - Once satisfied with dev testing

## Questions to Resolve

- [ ] Should blog posts have different max-width than other pages?
- [ ] Do we want to adjust line-height along with font-size?
- [ ] Should heading sizes scale proportionally or remain fixed?
- [ ] Are there any third-party components that might be affected?
- [ ] Should mobile font size remain 16px or also scale slightly?

## Resources

- [WCAG 2.1 Text Spacing Requirements](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html)
- [WCAG 2.1 Resize Text Requirements](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)
- [Optimal Reading Line Length](https://baymard.com/blog/line-length-readability)
- [Tailwind Typography Best Practices](https://tailwindcss.com/docs/font-size)
