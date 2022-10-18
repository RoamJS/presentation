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

export default runExtension({
  run: async () => {
    const mainStyle =
      addStyle(`@import url("https://unpkg.com/reveal.js@4.3.0/dist/reveal.css");
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
          "{{(presentation|slides|#?\\[\\[presentation\\]\\]|#?\\[\\[slides\\]\\]|#presentation|#slides):(.*)}}"
        )?.[2];
        const options = buttonText
          ? {
              theme: buttonText.match(
                `(?:\\[\\[{|{\\[\\[|{)theme:(${VALID_THEMES.join(
                  "|"
                )})(?:\\]\\]}|}\\]\\]|})`
              )?.[1],
              notes: buttonText.match(
                "(?:\\[\\[{|{\\[\\[|{)notes:(true|false)(?:\\]\\]}|}\\]\\]|})"
              )?.[1],
              collapsible: !!buttonText.match(COLLAPSIBLE_REGEX),
              animate: !!buttonText.match(ANIMATE_REGEX),
              transition: buttonText.match(TRANSITION_REGEX)?.[1] || "",
            }
          : {};
        render({
          button,
          getSlides: () => getFullTreeByParentUid(blockUid).children,
          options,
        });
      },
    });

    const themes = VALID_THEMES.map((s) => {
      const style = addStyle(
        `@import url("https://unpkg.com/reveal.js@4.3.0/dist/theme/${s}.css");`,
        `${s}.css`
      );
      style.className = "roamjs-style-reveal";
      style.disabled = true;
      return style;
    });

    return {
      elements: [mainStyle].concat(themes),
    };
  },
});
