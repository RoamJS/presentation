import { Button, Overlay } from "@blueprintjs/core";
import React, { FC, useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import BlockErrorBoundary from "roamjs-components/components/BlockErrorBoundary";
import getUids from "roamjs-components/dom/getUids";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import { TreeNode } from "roamjs-components/types";
import PresentationContent from "./PresentationContent";

const VALID_THEMES = [
  "black",
  "white",
  "beige",
  "league",
  "sky",
  "night",
  "serif",
  "simple",
  "solarized",
  "blood",
  "moon",
];

const unload = () =>
  Array.from(document.querySelectorAll("style.roamjs-style-reveal")).forEach(
    (s) => ((s as HTMLStyleElement).disabled = true)
  );

type Presentation = {
  getSlides: () => TreeNode[];
  theme?: string;
  notes?: string;
  collapsible?: boolean;
  animate?: boolean;
  transition?: string;
  windowId: string;
};
const Presentation = ({
  getSlides,
  windowId,
  theme = "black",
  notes,
  collapsible = false,
  animate = false,
  transition = "slide",
}: Presentation) => {
  const normalizedTheme = useMemo(
    () => (VALID_THEMES.includes(theme) ? theme : "black"),
    []
  );
  const showNotes = notes === "true";
  const [showOverlay, setShowOverlay] = useState(false);
  const [slides, setSlides] = useState<TreeNode[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const open = useCallback(async () => {
    setShowOverlay(true);
    Array.from(document.head.children)
      .filter((s) => s.id.endsWith(`${normalizedTheme}.css`))
      .forEach((s) => ((s as HTMLStyleElement).disabled = false));
  }, [setShowOverlay, normalizedTheme]);

  const onClose = useCallback(
    (currentSlide: number) => {
      setShowOverlay(false);
      setTimeout(() => {
        unload();
        const uidToFocus = slides[currentSlide].uid;
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: { "block-uid": uidToFocus, "window-id": windowId },
        });
      }, 1);
    },
    [setShowOverlay, slides, windowId]
  );

  const initPresentation = useCallback(() => {
    const slides = getSlides();
    setSlides(slides);
    const { blockUid } = getUids(document.activeElement as HTMLTextAreaElement);
    if (blockUid) {
      const matchesUid = (s: TreeNode) =>
        s.uid === blockUid || s.children.some(matchesUid);
      const startIndex = slides.findIndex(matchesUid);
      setStartIndex(Math.max(0, startIndex));
    } else {
      setStartIndex(0);
    }
  }, [getSlides, setSlides, setStartIndex]);

  return (
    <>
      <Button
        onClick={open}
        data-roamjs-presentation
        text={"PRESENT"}
        onMouseDown={initPresentation}
      />
      <Overlay isOpen={showOverlay}>
        <div
          style={{
            height: "100%",
            width: "100%",
            zIndex: 2000,
          }}
          id="roamjs-presentation-container"
        >
          <PresentationContent
            slides={slides}
            onClose={onClose}
            showNotes={showNotes}
            globalCollapsible={collapsible}
            globalAnimate={animate}
            globalTransition={transition}
            startIndex={startIndex}
          />
        </div>
      </Overlay>
    </>
  );
};

export const render2 = ({
  button,
  getSlides,
  options,
}: {
  button: HTMLButtonElement;
  getSlides: () => TreeNode[];
  options: { [key: string]: string | boolean };
}): void => {
  const { blockUid, windowId } = getUidsFromButton(button);
  ReactDOM.render(
    <BlockErrorBoundary
      blockUid={blockUid}
      message={
        "Error thrown when rendering presentation. Reach out to support@roamjs.com for help with this message: {ERROR}"
      }
    >
      <Presentation getSlides={getSlides} {...options} windowId={windowId} />
    </BlockErrorBoundary>,
    button.parentElement
  );
};
