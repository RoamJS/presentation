# Presentation renderer fixtures

These files are Roam-flavoured Markdown outlines intended to be copied and
pasted into a test graph.

- `baseline-presentation.md` contains two identical decks. The first runs the
  current `presentation` renderer and the second runs the experimental
  `presentation2` renderer. Use it for direct A/B comparisons.
- `native-renderer-coverage.md` contains cases that rely on Roam's native
  renderer and historically failed or required special handling in the custom
  presentation renderer.

## Baseline procedure

1. Copy the complete contents of `baseline-presentation.md` into an empty Roam
   page.
2. Confirm that the paste creates two top-level presentation button blocks and
   their child outlines.
3. Open `CURRENT RENDERER` and `NATIVE RENDERER` side by side and compare every
   slide at the same viewport size.
4. Test keyboard navigation, image expansion, collapsible bullets, returning
   focus on close, and printing in both decks.

Some Roam properties cannot be represented by a portable Markdown paste. For
the view-type slide, manually set the named parent blocks to Bulleted,
Numbered, and Document view before comparing the renderers.

## Native coverage procedure

The native coverage fixture intentionally contains setup placeholders. Replace
the clearly marked values with content from the test graph, then install or
enable the relevant Roam Depot extensions before testing extension-owned
components such as Excalidraw or Mermaid.

## Verified baseline

The extension was loaded into an authenticated Roam test graph using the local
`roam-playwright-session` and `roam-load-plugin` skills. The automated smoke
run passed without page errors:

| Case | Observed result |
| --- | --- |
| Current versus native baseline | 17 slides in each renderer |
| Native slide trees | 14 content-slide trees |
| Image Right | One native image in the right source pane and none duplicated in the body |
| Collapsible | First level hidden initially, first level revealed on click, deeper level still collapsed |
| Hidden content | Hidden block and descendants absent |
| Code highlighting | JavaScript and Turtle rendered in two native CodeMirror editors |
| LaTeX | Two native KaTeX renders |
| Query and search | One native query and one native search result view |
| Page embed | One native page embed |
| Block embed | One deeply nested native block embed with formatting and children |
| Block views | Document and Numbered source blocks retained their view types |
| Excalidraw | Editor opened in the slide and accepted a rectangle drawing gesture |
| Mermaid | One rendered SVG |
| Table | One native table |

The full visual proof is in
[`artifacts/renderer-proof/native-feature-coverage`](../artifacts/renderer-proof/native-feature-coverage/README.md).
Encrypted images, Drive-backed images, and arbitrary extension-owned
components remain explicit manual setup cases because they depend on graph or
account state.

Screenshot and video evidence for both renderer paths is saved in
[`artifacts/renderer-proof`](../artifacts/renderer-proof/README.md).
