import addStyle from "roamjs-components/dom/addStyle";
import {
  ANIMATE_REGEX,
  COLLAPSIBLE_REGEX,
  render,
  TRANSITION_REGEX,
  VALID_THEMES,
} from "./components/Presentation";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import runExtension from "roamjs-components/util/runExtension";
import { render2 } from "./components/Presentation2";

const getPresentationOptions = (
  buttonText?: string,
): { [key: string]: string | boolean } => {
  if (!buttonText) return {};
  const options: { [key: string]: string | boolean } = {
    collapsible: COLLAPSIBLE_REGEX.test(buttonText),
    animate: ANIMATE_REGEX.test(buttonText),
    transition: buttonText.match(TRANSITION_REGEX)?.[1] || "",
  };
  const theme = buttonText.match(
    `(?:\\[\\[{|{\\[\\[|{)theme:(${VALID_THEMES.join(
      "|",
    )})(?:\\]\\]}|}\\]\\]|})`,
  )?.[1];
  const notes = buttonText.match(
    "(?:\\[\\[{|{\\[\\[|{)notes:(true|false)(?:\\]\\]}|}\\]\\]|})",
  )?.[1];
  if (theme) options.theme = theme;
  if (notes) options.notes = notes;
  return options;
};

export default runExtension(async () => {
  const mainStyle =
    addStyle(`@import url("https://unpkg.com/reveal.js@4.3.0/dist/reveal.css");
code[class*="language-"],pre[class*="language-"]{color:black;text-shadow:0 1px white;font-family:Consolas,Monaco,'Andale Mono',monospace;direction:ltr;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre[class*="language-"]::-moz-selection,pre[class*="language-"] ::-moz-selection,code[class*="language-"]::-moz-selection,code[class*="language-"] ::-moz-selection{text-shadow:none;background:#b3d4fc}pre[class*="language-"]::selection,pre[class*="language-"] ::selection,code[class*="language-"]::selection,code[class*="language-"] ::selection{text-shadow:none;background:#b3d4fc}@media print{code[class*="language-"],pre[class*="language-"]{text-shadow:none}}pre[class*="language-"]{padding:1em;margin:.5em 0;overflow:auto}:not(pre)>code[class*="language-"],pre[class*="language-"]{background:#f5f2f0}:not(pre)>code[class*="language-"]{padding:.1em;border-radius:.3em}.token.comment,.token.prolog,.token.doctype,.token.cdata{color:slategray}.token.punctuation{color:#999}.namespace{opacity:.7}.token.property,.token.tag,.token.boolean,.token.number,.token.constant,.token.symbol,.token.deleted{color:#905}.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:#690}.token.operator,.token.entity,.token.url,.language-css .token.string,.style .token.string{color:#a67f59;background:hsla(0,0,100%,.5)}.token.atrule,.token.attr-value,.token.keyword{color:#07a}.token.function{color:#dd4a68}.token.regex,.token.important,.token.variable{color:#e90}.token.important,.token.bold{font-weight:bold}.token.italic{font-style:italic}.token.entity{cursor:help}
.roamjs-collapsible-caret {
  position: absolute;
  top: 12px;
  left: -45px;
  cursor: pointer;
}
.reveal ul {
  list-style-type: disc !important;
}
.reveal ol {
  list-style-type: decimal !important;
}
.roamjs-presentation-img-dialog {
  z-index: 2100;
}
.roamjs-presentation-img-dialog .bp3-dialog {
  position: absolute;
  top: 32px;
  bottom: 32px;
  left: 32px;
  right: 32px;
  width: unset;
  background-color: transparent;
}
.roamjs-collapsible-bullet, .roamjs-document-li {
  list-style: none;
}
.reveal .roamjs-bullets-container h1, .reveal .roamjs-bullets-container h2, .reveal .roamjs-bullets-container h3, .reveal .roamjs-bullets-container h4, .reveal .roamjs-bullets-container h5, .reveal .roamjs-bullets-container h6 {
  margin-bottom: 0;
  text-transform: none;
}
.roamjs-bullets-container .check-container input:checked~.checkmark:after {
  display: block;
  width: 15px;
  height: 30px;
  left: 11.5px;
  top: 0.75px;
  border-width: 0 6px 6px 0;
}
.roamjs-bullets-container .check-container {
  height: 36px;
  width: 36px;
  top: 3px;
}
.reveal li>blockquote {
  font-size: 1em;
  width: 100%;
  padding: 10px 20px;
}
.roamjs-bullets-container iframe {
  position: unset;
}
.reveal .roam-render .roam-block-container .rm-block-children {
  display: none;
}

.reveal .excalidraw-host {
  pointer-events: none;
  display: inline-block;
}

.reveal .rm-block-ref {
  pointer-events: none;
}

/* Keep graph themes from replacing the presentation's typography. */
#roamjs-presentation-container .slides :is(.roam-block-container, .rm-block-main, .rm-block__input) {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
#roamjs-presentation-container .slides .rm-block__input {
  min-height: 0 !important;
}
#roamjs-presentation-container .slides :is(.rm-page-ref, .rm-alias) {
  color: var(--r-link-color);
  background: transparent;
  font-size: inherit;
  font-family: inherit;
  border: 0;
}
#roamjs-presentation-container .slides :is(.rm-page-ref__brackets, .rm-block-ref, .rm-strikethrough) {
  color: inherit;
}
#roamjs-presentation-container .slides .rm-highlight {
  color: #202224;
}
#roamjs-presentation-container .slides :not(pre) > code {
  font-size: 0.9em;
  line-height: inherit;
}

#roamjs-presentation-container .slides .rm-code-block .cm-line {
  font-family: monospace;
  font-size: inherit;
  line-height: 1.4;
}

#roamjs-presentation-container .slides :is(.rm-table, .rm-table__cell, tr, td, th, .rm-attr-ref, blockquote) {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
#roamjs-presentation-container .slides .rm-heading-level-1 > .rm-block-main .rm-block__input {
  font-size: 1.4em !important;
}
#roamjs-presentation-container .slides .rm-heading-level-2 > .rm-block-main .rm-block__input {
  font-size: 1.2em !important;
}
#roamjs-presentation-container .slides .rm-heading-level-3 > .rm-block-main .rm-block__input {
  font-size: 1.1em !important;
}
#roamjs-presentation-container .slides :is(.rm-bullet, .rm-bullet__inner) {
  font-size: inherit;
}
#roamjs-presentation-container .slides .rm-block--document > .rm-block-main > .rm-block__controls {
  visibility: hidden;
}

#roamjs-presentation-container .slides :is(.rm-embed-container, .rm-embed-settings, .rm-query, .rm-query-title, .rm-search-query-header) {
  background-color: transparent;
  color: inherit;
}

#roamjs-presentation-container .slides :is(.rm-page__title, .rm-page__title a) {
  color: var(--r-link-color);
  font-size: inherit;
}

[data-roamjs-native-renderer] .roamjs-native-block-string * {
  color: inherit;
  font-family: Inter, sans-serif;
  font-size: inherit;
  line-height: 1.3;
  text-transform: inherit;
  white-space: normal;
  overflow-wrap: anywhere;
}

[data-roamjs-native-renderer] .roamjs-native-block-string {
  display: block;
  width: 100%;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree,
[data-roamjs-native-renderer] .roamjs-native-slide-tree > div,
[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-api-render--block,
[data-roamjs-native-renderer] .roamjs-native-source-container > div,
[data-roamjs-native-renderer] .roamjs-native-source-container .rm-api-render--block,
[data-roamjs-native-renderer] .roamjs-native-source-container .roam-block-container,
[data-roamjs-native-renderer] .roamjs-native-source-container .rm-block-main,
[data-roamjs-native-renderer] .roamjs-native-source-container .rm-block__input {
  max-width: none;
  width: 100%;
}

[data-roamjs-native-renderer] .roamjs-native-bullets-container {
  overflow: visible;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .roam-block-container:has(> .rm-block-main :is(.rm-table, .rm-mermaid)) > .rm-block-main {
  display: block !important;
  flex: 1 1 auto !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  min-width: 0;
  overflow: visible;
  padding-left: 0 !important;
  padding-right: 0 !important;
  width: 100% !important;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .roam-block-container:has(> .rm-block-main :is(.rm-table, .rm-mermaid)) > .rm-block-main > .rm-block__controls,
[data-roamjs-native-renderer] .roamjs-native-slide-tree .roam-block-container:has(> .rm-block-main :is(.rm-table, .rm-mermaid)) > .rm-block-children {
  display: none;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block__input:has(.rm-table),
[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-table,
[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-table table {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  width: 100% !important;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-table table {
  background-color: transparent;
  border-bottom: 1px solid #a7b6c2;
  color: inherit;
  table-layout: fixed;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-table td {
  color: inherit;
  max-width: none !important;
  min-width: 0 !important;
  width: auto !important;
}

#roamjs-reveal-root[data-roamjs-show-notes="true"] .slides > section > h1,
#roamjs-reveal-root[data-roamjs-show-notes="true"] .slides > section > h3,
#roamjs-reveal-root[data-roamjs-show-notes="true"] .slides > section > .r-stretch {
  width: 83.333333%;
}

[data-roamjs-native-renderer] .roamjs-native-content-slide > h1 {
  margin-bottom: 35px;
  margin-top: 20px;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree {
  font-size: 1.083333em;
}

/* Reveal also uses the generic controls class and hides it. Restore Roam's
   block controls so native bullets and numbered markers remain visible. */
[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block__controls {
  align-items: flex-start;
  bottom: auto;
  color: inherit;
  display: flex;
  flex: 0 0 1em;
  font-size: inherit;
  left: auto;
  opacity: 1;
  pointer-events: auto;
  position: static;
  right: auto;
  top: auto;
  width: 1em;
  z-index: auto;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block__controls .block-expand {
  display: none;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block__controls .rm-bullet {
  align-items: center;
  color: inherit;
  display: flex;
  height: 1em;
  justify-content: center;
  opacity: 1;
  width: 1em;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-bullet__inner {
  background-color: currentColor;
  height: 0.25em;
  width: 0.25em;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-multibar {
  display: none;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block-children {
  border-left: 0;
  padding-left: 0;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree > .rm-api-render--block > .roam-block-container > .rm-block-children {
  margin-left: 0.5em;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block-children .rm-block-children {
  margin-left: 1.65em;
}

[data-roamjs-native-renderer] .roamjs-native-slide-tree .rm-block__input {
  flex: 1 1 auto;
  min-width: 0;
}

[data-roamjs-native-renderer] .roamjs-native-collapsible-node-content {
  position: relative;
}

[data-roamjs-native-renderer] .roamjs-native-collapsible-node-content-has-children .rm-block__controls {
  visibility: hidden;
}

[data-roamjs-native-renderer] .roamjs-native-collapsible {
  padding-left: 32px;
}

[data-roamjs-native-renderer] .roamjs-native-collapsible-toggle {
  color: inherit;
  left: -32px;
  position: absolute;
  top: 4px;
  z-index: 1;
}

[data-roamjs-native-renderer] .roamjs-native-collapsible-children {
  margin-left: 32px;
}

[data-roamjs-native-renderer] .roamjs-native-source-container img,
[data-roamjs-native-renderer] .roamjs-native-source-container video,
[data-roamjs-native-renderer] .roamjs-native-source-container svg {
  max-height: 100%;
  max-width: 100%;
}

[data-roamjs-native-renderer] .roamjs-native-source-container {
  align-items: center;
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

[data-roamjs-native-renderer] .roamjs-native-source-container > span {
  display: none !important;
}

[data-roamjs-native-renderer] .roamjs-native-source-container > div,
[data-roamjs-native-renderer] .roamjs-native-source-container .rm-iframe-container,
[data-roamjs-native-renderer] .roamjs-native-source-container .rm-video-player {
  height: auto !important;
  inset: auto !important;
  position: static !important;
  width: 100%;
}

[data-roamjs-native-renderer] .roamjs-native-source-container iframe {
  aspect-ratio: 16 / 9;
  height: auto !important;
  inset: auto !important;
  max-height: 100%;
  max-width: 100%;
  position: static !important;
  width: 100% !important;
}

[data-roamjs-native-renderer] .roamjs-native-source-container .rm-multibar {
  display: none;
}

[data-roamjs-native-renderer] .roamjs-native-source-container .rm-block-children {
  border-left: 0;
}

[data-roamjs-native-renderer] .roamjs-native-notes {
  display: none;
}
`);
  createButtonObserver({
    attribute: "presentation",
    shortcut: "slides",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      if (!blockUid) {
        return;
      }
      const text = getTextByBlockUid(blockUid);
      const buttonText = text.match(
        "{{(presentation|slides|#?\\[\\[presentation\\]\\]|#?\\[\\[slides\\]\\]|#presentation|#slides):(.*)}}",
      )?.[2];
      const options = getPresentationOptions(buttonText);
      render({
        button,
        getSlides: () => getFullTreeByParentUid(blockUid).children,
        options,
      });
    },
  });
  createButtonObserver({
    attribute: "presentation2",
    shortcut: "slides2",
    render: (button: HTMLButtonElement) => {
      const { blockUid } = getUidsFromButton(button);
      if (!blockUid) return;
      const text = getTextByBlockUid(blockUid);
      const buttonText = text.match(
        "{{(presentation2|slides2|#?\\[\\[presentation2\\]\\]|#?\\[\\[slides2\\]\\]|#presentation2|#slides2):(.*)}}",
      )?.[2];
      render2({
        button,
        getSlides: () => getFullTreeByParentUid(blockUid).children,
        options: getPresentationOptions(buttonText),
      });
    },
  });

  const themes = VALID_THEMES.map((s) => {
    const style = addStyle(
      `@import url("https://unpkg.com/reveal.js@4.3.0/dist/theme/${s}.css");`,
      `${s}.css`,
    );
    style.className = "roamjs-style-reveal";
    style.disabled = true;
    return style;
  });

  return {
    elements: [mainStyle].concat(themes),
  };
});
