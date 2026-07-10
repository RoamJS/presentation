# Renderer proof captures

Captured from an authenticated Roam test graph at 1440×900 using the local
`roam-playwright-session` and `roam-load-plugin` workflows. Both renderer paths
used the paired Markdown baseline in `fixtures/baseline-presentation.md`.

## Videos

- `original-renderer.mp4` — 12.92 seconds. Opens `presentation`, navigates
  formatting and nesting, demonstrates Image Right, expands a collapsible
  outline, verifies hidden content, and closes the presentation.
- `presentation2-native-renderer.mp4` — 23.36 seconds. Repeats the baseline
  walkthrough with `presentation2`, then demonstrates Roam-native JavaScript
  and Turtle code highlighting, LaTeX, query/search, and Mermaid rendering.

## Screenshots

The `original-*` and `presentation2-*` images capture matching baseline states:
title, inline formatting, Image Right, collapsible, and hidden content. The
additional `presentation2-*` images capture code highlighting, LaTeX,
query/search, and Mermaid.

`capture-result.json` records the fixture UIDs, slide counts, dimensions,
durations, and page-error result. The capture completed with 17 slides in each
baseline renderer and no page errors.

## Slide-by-slide comparison

The post-fix [`side-by-side-fixed`](side-by-side-fixed/README.md) set contains
matched original and native screenshots for all 17 visible baseline slides,
plus a contact sheet, raw captures, and computed layout metrics. The earlier
[`side-by-side`](side-by-side/README.md) capture remains available as the
before-fix record.

## Native feature coverage

The [`native-feature-coverage`](native-feature-coverage/README.md) deck proves
native code highlighting, KaTeX, query/search, page and block embeds, Document
and Numbered views, Excalidraw drawing input, Mermaid, and Roam's table
component inside `presentation2`.
