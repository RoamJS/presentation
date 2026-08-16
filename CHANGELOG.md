# Changelog

## Unreleased

- Fixed presentation2 overflow scaling so long text wraps across the full slide width.
- Fixed native tables in presentation2 to use the slide width, inherit the active theme, render complete borders, and hide their duplicate source outline.
- Fixed presentation2 title detection and hidden-block handling after filtering hidden slide children.
- Added a bounded overflow fallback for presentation2 slides that cannot fit at the minimum scale.
