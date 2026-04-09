---
title: "Modern CSS Is Actually Amazing"
slug: "modern-css-is-amazing"
date: "2026-04-05"
tags: ["css", "web-development", "frontend"]
description: "Native nesting, :has(), container queries, scroll-driven animations — the platform caught up."
draft: false
---

For a long time, "I don't use a CSS preprocessor" was a statement of suffering. You'd hand-write BEM selectors, duplicate variable values across files, and reach for JavaScript any time you needed parent-aware behavior. The platform lagged and the ecosystem filled the gap.

That era is over. I rebuilt my personal site on vanilla CSS and there was genuinely not a single moment where I wished for Sass.

## Nesting without a compiler

Nesting landed in every major browser in 2023. It works how you'd expect — the spec syntax, not the preprocessor syntax. Parent selector (`&`) works too.

```css
.nav__links {
  display: flex;
  gap: var(--space-lg);

  & a {
    color: var(--color-text-muted);
    border-block-end: 0.125rem solid transparent;

    &:hover,
    &[aria-current="page"] {
      color: var(--color-text);
      border-block-end-color: var(--color-accent);
    }
  }
}
```

No build step. No source maps to wrangle. The nesting is in the stylesheet the browser reads.

## `:has()` as a logic gate

`:has()` is the CSS feature I wanted most for the longest time. It's a relational pseudo-class — select an element based on what it contains. I'm using it to drive the mobile nav open state off a hidden checkbox without a line of JavaScript:

```css
.nav:has(#nav-toggle:checked) {
  & .nav__links {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}
```

The checkbox is `position: absolute; inset-inline-start: -9999px` so it's invisible but still focusable. The label element is the hamburger icon. Toggling state is CSS, not JS.

## Container queries over media queries

I spent years writing breakpoints for components that I had to mentally map back to the page layout to understand. Container queries let you write responsive rules at the component boundary instead.

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 31.25rem) {
  .card {
    grid-template-columns: 14rem 1fr;
  }
}
```

Now the card responds to the space it actually has, not the viewport width. Move it from a 2-column grid to a sidebar and it just works.

## Scroll-driven animations

This one is still bleeding-edge — Chrome/Edge-only as of early 2026, with Firefox in progress. But the progressive enhancement path is clean: put the animation in an `@supports (animation-timeline: view())` block, fall back to an IntersectionObserver JS module otherwise.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-reveal="slide"] {
      animation: slide-up linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }
  }
}
```

When the browser supports it, the animation is pure CSS with no JavaScript budget. When it doesn't, a small fallback module mounts and handles it with IntersectionObserver. Either way, users who prefer reduced motion see nothing animate.

The platform is in genuinely good shape right now. I don't want to oversell it — you still need to know what you're doing, and some design patterns still want a preprocessor or a component model. But for a content site with modern browser targets, vanilla CSS is no longer a tradeoff. It's just the right tool.
