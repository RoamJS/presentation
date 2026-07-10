# Parallel native-renderer architecture

The current renderer remains available under `presentation` and `slides`. The
rewrite is intentionally parallel under `presentation2` and `slides2`, so both
can be exercised against the same outline while the native path is proven.

## Tree 1: current renderer, unchanged

```text
presentation / slides button observer
└── getFullTreeByParentUid
    └── render
        └── Presentation
            └── PresentationContent + Reveal
                ├── TitleSlide
                │   └── getParseRoamBlocks / custom parsed output
                └── ContentSlide
                    ├── getParseRoamBlocks / custom parsed bullet output
                    ├── SrcFromText / custom image, iframe, and media handling
                    ├── Notes
                    └── custom hide, view, and collapsible transforms
```

This path continues to own the production commands and behavior. The only
change in `Presentation.tsx` is a type-compatible empty `parents` value for the
existing parser input.

## Tree 2: native rewrite

```text
presentation2 / slides2 button observer
└── getFullTreeByParentUid
    └── render2
        └── Presentation2
            ├── prepareSlides
            │   └── presentation metadata only
            │       (title, hide, notes, layout, transition, animate, collapsible)
            └── NativePresentationContent + Reveal
                ├── NativeTitleSlide
                │   └── ui.react.BlockString
                ├── NativeContentSlide
                │   ├── ui.react.Block for the complete slide tree
                │   ├── ui.react.Block for layout source media
                │   └── ui.react.Block for speaker notes
                └── NativeCollapsibleNode
                    └── ui.react.Block per progressively revealed node
```

The rewrite keeps presentation-specific orchestration—Reveal, layouts, notes,
navigation, focus restoration, printing, transitions, hiding, and progressive
collapsibles—but delegates actual Roam content to Roam. This is what lets code
blocks, queries, search, embeds, and extension-owned renderers retain their
native behavior and lifecycle.

## Native API allocation

| API | Best use in Presentation |
| --- | --- |
| `ui.render.block` | Imperative rendering into a non-React host or a one-off integration point |
| `ui.render.page` | Imperative full-page rendering outside the React component tree |
| `ui.render.string` | Imperative rendering of Roam markup when only a host element is available |
| `ui.react.Block` | Slide trees, source media blocks, speaker notes, and collapsible nodes |
| `ui.react.Page` | Future page-oriented slides that need the full page body rather than an embed macro |
| `ui.react.BlockString` | Slide titles and other Roam-formatted strings after presentation directives are removed |
| `ui.react.Search` | Future search-oriented slides, including grouping, paths, collapsed state, and config updates |

`NativeRoamContent.tsx` is the typed adapter for the declarative APIs. It
already exposes Block, Page, BlockString, and Search; Presentation2 currently
uses Block and BlockString directly, while Page and Search are ready for
page/search-specific layouts without adding another rendering abstraction.
