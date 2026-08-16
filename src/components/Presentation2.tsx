import { Button, Dialog, Overlay } from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import BlockErrorBoundary from "roamjs-components/components/BlockErrorBoundary";
import getUids from "roamjs-components/dom/getUids";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import addStyle from "roamjs-components/dom/addStyle";
import { TreeNode } from "roamjs-components/types";
import isControl from "roamjs-components/util/isControl";
import {
  ANIMATE_REGEX,
  COLLAPSIBLE_REGEX,
  TITLE_REGEX,
  TRANSITION_REGEX,
  VALID_THEMES,
} from "./Presentation";
import NativeRoamContent from "./NativeRoamContent";
import { getVisibleLayoutSource, HIDE_REGEX } from "./nativeSlideUtils";

const LAYOUTS = [
  "Image Left",
  "Image Center",
  "Image Right",
  "Iframe Left",
  "Iframe Center",
  "Iframe Right",
  "Media Left",
  "Media Center",
  "Media Right",
];
const LAYOUT_REGEX = new RegExp(
  `(?:\\[\\[{|{\\[\\[|{)layout:(${LAYOUTS.join("|")})(?:\\]\\]}|}\\]\\]|})`,
  "is",
);
const STARTS_WITH_IMAGE = /^image /i;
const STARTS_WITH_IFRAME = /^iframe /i;
const STARTS_WITH_MEDIA = /^media /i;
const ENDS_WITH_LEFT = / left$/i;
const ENDS_WITH_CENTER = / center$/i;
const TITLE_SOURCE_REGEX = /^(?:!\[.*\]\(.*\)|{{(?:\[\[)?iframe)/i;

type PreparedSlide = TreeNode & {
  displayText: string;
  isTitle: boolean;
  layout: string;
  collapsible: boolean;
  animate: boolean;
  transition?: string;
  contentChildren: TreeNode[];
  note?: TreeNode;
};

type PresentationOptions = {
  getSlides: () => TreeNode[];
  theme?: string;
  notes?: string;
  collapsible?: boolean;
  animate?: boolean;
  transition?: string;
  windowId: string;
};

const collectHiddenUids = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((node) =>
    HIDE_REGEX.test(node.text)
      ? [node.uid]
      : collectHiddenUids(node.children || []),
  );

export const prepareSlides = ({
  slides,
  showNotes,
  globalCollapsible,
  globalAnimate,
  globalTransition,
}: {
  slides: TreeNode[];
  showNotes: boolean;
  globalCollapsible: boolean;
  globalAnimate: boolean;
  globalTransition?: string;
}): PreparedSlide[] =>
  slides
    .filter((slide) => !HIDE_REGEX.test(slide.text))
    .map((slide) => {
      let layout = "default";
      let collapsible = globalCollapsible;
      let animate = globalAnimate;
      let transition = globalTransition;
      let isTitle = !slide.children.length;
      const displayText = slide.text
        .replace(LAYOUT_REGEX, (_, capture: string) => {
          layout = capture;
          return "";
        })
        .replace(COLLAPSIBLE_REGEX, (_, ignore: string) => {
          collapsible = !ignore;
          return "";
        })
        .replace(ANIMATE_REGEX, () => {
          animate = true;
          return "";
        })
        .replace(TRANSITION_REGEX, (_, value: string) => {
          transition = value;
          return "";
        })
        .replace(TITLE_REGEX, () => {
          isTitle = true;
          return "";
        })
        .trim();
      const visibleChildren = slide.children.filter(
        (child) => !HIDE_REGEX.test(child.text),
      );
      const note = showNotes
        ? visibleChildren[visibleChildren.length - 1]
        : undefined;
      const contentChildren = showNotes
        ? visibleChildren.slice(0, -1)
        : visibleChildren;

      return {
        ...slide,
        displayText,
        isTitle,
        layout,
        collapsible,
        animate,
        transition,
        contentChildren,
        note,
      };
    });

const escapeAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const getBlockContainer = (element: Element | null) =>
  element?.closest<HTMLElement>(
    ".roam-block-container, .rm-block-main, [data-block-uid]",
  ) || null;

const NativeCollapsibleNode = ({ node }: { node: TreeNode }) => {
  const [expanded, setExpanded] = useState(false);
  const children = node.children.filter(
    (child) => !HIDE_REGEX.test(child.text),
  );

  return (
    <div className="roamjs-native-collapsible-node">
      <div
        className={`roamjs-native-collapsible-node-content${
          children.length
            ? " roamjs-native-collapsible-node-content-has-children"
            : ""
        }`}
      >
        {!!children.length && (
          <button
            aria-label={expanded ? "Collapse bullet" : "Expand bullet"}
            className="bp3-button bp3-minimal roamjs-native-collapsible-toggle"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            <span
              className={`bp3-icon bp3-icon-caret-${
                expanded ? "down" : "right"
              }`}
            />
          </button>
        )}
        <NativeRoamContent kind="block" uid={node.uid} open={false} />
      </div>
      {expanded && (
        <div className="roamjs-native-collapsible-children">
          {children.map((child) => (
            <NativeCollapsibleNode key={child.uid} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const NativeExpandedSlideTree = ({
  slide,
  hiddenUids,
}: {
  slide: PreparedSlide;
  hiddenUids: string[];
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const applyPresentationVisibility = () => {
      const rootUid = escapeAttributeValue(slide.uid);
      const rootUidElement = root.querySelector(
        `[data-uid="${rootUid}"], [data-block-uid="${rootUid}"]`,
      );
      const rootContainer =
        getBlockContainer(rootUidElement) ||
        root.querySelector<HTMLElement>(".roam-block-container");
      const rootMain =
        rootContainer?.querySelector<HTMLElement>(":scope > .rm-block-main") ||
        rootContainer?.querySelector<HTMLElement>(".rm-block-main");
      if (rootMain) rootMain.style.display = "none";

      hiddenUids.forEach((uid) => {
        const escapedUid = escapeAttributeValue(uid);
        root
          .querySelectorAll(
            `[data-uid="${escapedUid}"], [data-block-uid="${escapedUid}"]`,
          )
          .forEach((element) => {
            const container = getBlockContainer(element);
            if (container && container !== rootContainer) {
              container.style.display = "none";
            }
          });
      });

      root.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
      });
    };

    applyPresentationVisibility();
    const observer = new MutationObserver(applyPresentationVisibility);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [slide.uid, hiddenUids.join("|")]);

  return (
    <div ref={rootRef} className="roamjs-native-slide-tree">
      <NativeRoamContent kind="block" uid={slide.uid} open />
    </div>
  );
};

const NativeSlideTree = ({
  slide,
  hiddenUids,
}: {
  slide: PreparedSlide;
  hiddenUids: string[];
}) => {
  if (slide.collapsible) {
    const hiddenUidSet = new Set(hiddenUids);
    const visibleNodes = slide.contentChildren.filter(
      (node) => !hiddenUidSet.has(node.uid) && !HIDE_REGEX.test(node.text),
    );
    return (
      <div className="roamjs-native-slide-tree roamjs-native-collapsible">
        {visibleNodes.map((node) => (
          <NativeCollapsibleNode key={node.uid} node={node} />
        ))}
      </div>
    );
  }

  return <NativeExpandedSlideTree slide={slide} hiddenUids={hiddenUids} />;
};

const NativeNotes = ({ note }: { note?: TreeNode }) =>
  note ? (
    <aside className="notes roamjs-native-notes">
      <NativeRoamContent kind="block" uid={note.uid} open />
    </aside>
  ) : null;

const NativeTitleSlide = ({ slide }: { slide: PreparedSlide }) => {
  const visibleChildren = slide.contentChildren.filter(
    (child) => !HIDE_REGEX.test(child.text),
  );
  const props = {
    style: {
      textAlign: slide.textAlign || "left",
      ...(TITLE_SOURCE_REGEX.test(slide.displayText) ? { bottom: 0 } : {}),
    },
    ...(slide.animate ? { "data-auto-animate": true } : {}),
    ...(slide.transition ? { "data-transition": slide.transition } : {}),
  };

  return (
    <section className="roamjs-native-title-slide" {...props}>
      <h1
        className="roamjs-native-block-string"
        style={{ textAlign: slide.textAlign || "left" }}
      >
        <NativeRoamContent kind="string" string={slide.displayText} />
      </h1>
      {visibleChildren.map((child) => (
        <h3
          className="roamjs-native-block-string"
          key={child.uid}
          style={{ textAlign: child.textAlign || "left" }}
        >
          <NativeRoamContent kind="string" string={child.text} />
        </h3>
      ))}
      <NativeNotes note={slide.note} />
    </section>
  );
};

const NativeContentSlide = ({ slide }: { slide: PreparedSlide }) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(slide.layout);
  const isIframeLayout = STARTS_WITH_IFRAME.test(slide.layout);
  const isMediaLayout = STARTS_WITH_MEDIA.test(slide.layout);
  const isSourceLayout = isImageLayout || isIframeLayout || isMediaLayout;
  const isLeftLayout = ENDS_WITH_LEFT.test(slide.layout);
  const isCenterLayout = ENDS_WITH_CENTER.test(slide.layout);
  const source = getVisibleLayoutSource({
    contentChildren: slide.contentChildren,
    isSourceLayout,
  });
  const hiddenUids = collectHiddenUids(slide.contentChildren).concat(
    source?.uid || [],
    slide.note?.uid || [],
  );
  const [imageDialogSrc, setImageDialogSrc] = useState("");
  const onRootClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "IMG") {
      setImageDialogSrc((target as HTMLImageElement).src);
    }
  }, []);
  const sectionProps = {
    ...(slide.animate ? { "data-auto-animate": true } : {}),
    ...(slide.transition ? { "data-transition": slide.transition } : {}),
  };

  return (
    <section
      className="roamjs-native-content-slide"
      style={{ textAlign: "left" }}
      {...sectionProps}
    >
      <h1
        className="roamjs-native-block-string"
        style={{ textAlign: slide.textAlign || "left" }}
      >
        <NativeRoamContent kind="string" string={slide.displayText} />
      </h1>
      <div
        className="r-stretch roamjs-native-slide-content"
        style={{
          display: "flex",
          flexDirection: isLeftLayout ? "row-reverse" : "row",
        }}
        onClick={onRootClick}
      >
        <div
          className="roamjs-bullets-container roamjs-native-bullets-container"
          style={{
            width: isSourceLayout && !isCenterLayout ? "50%" : "100%",
            transformOrigin: "left top",
            wordBreak: "break-word",
            display: isCenterLayout ? "none" : "block",
          }}
        >
          <NativeSlideTree slide={slide} hiddenUids={hiddenUids} />
        </div>
        {source && (
          <div
            className="roamjs-media-container roamjs-native-source-container"
            style={{
              width: isCenterLayout ? "100%" : "50%",
              textAlign: "center",
              alignSelf: "center",
              height: "100%",
            }}
          >
            <NativeRoamContent kind="block" uid={source.uid} open />
          </div>
        )}
      </div>
      <NativeNotes note={slide.note} />
      <Dialog
        isOpen={!!imageDialogSrc}
        onClose={() => setImageDialogSrc("")}
        portalClassName="roamjs-presentation-img-dialog"
        style={{ paddingBottom: 0 }}
      >
        <img src={imageDialogSrc} />
      </Dialog>
    </section>
  );
};

const scaleActiveSlide = (slidesElement: HTMLElement) => {
  const container = slidesElement.querySelector<HTMLElement>(
    ".present .roamjs-bullets-container",
  );
  if (!container) return;
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const content = container.firstElementChild as HTMLElement | null;
  if (!content || containerHeight <= 0 || containerWidth <= 0) return;
  const contentHeight = content.offsetHeight;
  const contentWidth = content.offsetWidth;
  if (contentHeight > containerHeight || contentWidth > containerWidth) {
    const scale = Math.min(
      containerHeight / contentHeight,
      containerWidth / contentWidth,
    );
    container.style.transform = `scale(${scale})`;
  } else {
    container.style.transform = "initial";
  }
};

const NativePresentationContent = ({
  slides,
  onClose,
  showNotes,
  globalCollapsible,
  globalAnimate,
  globalTransition,
  startIndex,
}: {
  slides: TreeNode[];
  onClose: (index: number) => void;
  showNotes: boolean;
  globalCollapsible: boolean;
  globalAnimate: boolean;
  globalTransition?: string;
  startIndex: number;
}) => {
  const revealRef = useRef<any>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const preparedSlides = useMemo(
    () =>
      prepareSlides({
        slides,
        showNotes,
        globalCollapsible,
        globalAnimate,
        globalTransition,
      }),
    [slides, showNotes, globalCollapsible, globalAnimate, globalTransition],
  );
  const [initialized, setInitialized] = useState(false);

  const close = useCallback(
    (event?: Event) => {
      const reveal = revealRef.current;
      if (!reveal) return;
      reveal.getRevealElement().style.display = "none";
      const currentSlide = preparedSlides[reveal.getState().indexh];
      const actualIndex = currentSlide
        ? slides.findIndex((slide) => slide.uid === currentSlide.uid)
        : 0;
      onClose(Math.max(0, actualIndex));
      event?.stopImmediatePropagation();
    },
    [onClose, preparedSlides, slides],
  );

  useEffect(() => {
    if (!slidesRef.current) return;
    const deck = new Reveal({
      embedded: true,
      slideNumber: "c/t",
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.9,
      showNotes,
      minScale: 1,
      maxScale: 1,
    });
    deck.initialize();
    revealRef.current = deck;
    const observer = new MutationObserver(() => {
      if (slidesRef.current) scaleActiveSlide(slidesRef.current);
      revealRef.current?.layout?.();
    });
    observer.observe(slidesRef.current, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
    setInitialized(true);
    return () => {
      observer.disconnect();
      (deck as Reveal & { destroy?: () => void }).destroy?.();
    };
  }, [showNotes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(event);
      } else if (
        isControl(event) &&
        event.key === "p" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        revealRef.current.isPrintingPdf = () => true;
        const injectedStyle = addStyle(`@media print {
  body * { visibility: hidden; }
  #roamjs-presentation-container #roamjs-reveal-root * { visibility: visible; }
  #roamjs-presentation-container * {
    position: absolute;
    left: 0;
    top: 0;
  }
}`);
        const onAfterPrint = () => {
          injectedStyle.remove();
          window.removeEventListener("afterprint", onAfterPrint);
        };
        window.addEventListener("afterprint", onAfterPrint);
        window.print();
        event.preventDefault();
      }
    };
    document.body.addEventListener("keydown", onKeyDown);
    return () => document.body.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (!initialized || startIndex <= 0) return;
    const selectedSlide = slides[startIndex];
    const actualIndex = preparedSlides.findIndex(
      (slide) => slide.uid === selectedSlide?.uid,
    );
    if (actualIndex >= 0) revealRef.current.slide(actualIndex);
  }, [initialized, startIndex, slides, preparedSlides]);

  return (
    <>
      <div
        className="reveal"
        id="roamjs-reveal-root"
        data-roamjs-show-notes={showNotes}
      >
        <div className="slides" ref={slidesRef}>
          {preparedSlides.map((slide) =>
            slide.isTitle ? (
              <NativeTitleSlide key={slide.uid} slide={slide} />
            ) : (
              <NativeContentSlide key={slide.uid} slide={slide} />
            ),
          )}
        </div>
      </div>
      <Button
        icon="cross"
        onClick={(event: React.MouseEvent) => close(event.nativeEvent)}
        minimal
        style={{ position: "absolute", top: 8, right: 8 }}
      />
    </>
  );
};

const unloadTheme = () =>
  Array.from(document.querySelectorAll("style.roamjs-style-reveal")).forEach(
    (style) => ((style as HTMLStyleElement).disabled = true),
  );

const Presentation2 = ({
  getSlides,
  theme = "black",
  notes,
  collapsible = false,
  animate = false,
  transition = "slide",
  windowId,
}: PresentationOptions) => {
  const normalizedTheme = useMemo(
    () => (VALID_THEMES.includes(theme) ? theme : "black"),
    [theme],
  );
  const showNotes = notes === "true";
  const [showOverlay, setShowOverlay] = useState(false);
  const [slides, setSlides] = useState<TreeNode[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const initializePresentation = useCallback(() => {
    const nextSlides = getSlides();
    setSlides(nextSlides);
    const { blockUid } = getUids(document.activeElement as HTMLTextAreaElement);
    if (!blockUid) {
      setStartIndex(0);
      return;
    }
    const containsUid = (slide: TreeNode): boolean =>
      slide.uid === blockUid || slide.children.some(containsUid);
    setStartIndex(Math.max(0, nextSlides.findIndex(containsUid)));
  }, [getSlides]);

  const open = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) initializePresentation();
      setShowOverlay(true);
      Array.from(document.head.children)
        .filter((style) => style.id.endsWith(`${normalizedTheme}.css`))
        .forEach((style) => ((style as HTMLStyleElement).disabled = false));
    },
    [initializePresentation, normalizedTheme],
  );

  const close = useCallback(
    (currentSlide: number) => {
      setShowOverlay(false);
      setTimeout(() => {
        unloadTheme();
        const uid = slides[currentSlide]?.uid;
        if (uid) {
          window.roamAlphaAPI.ui.setBlockFocusAndSelection({
            location: { "block-uid": uid, "window-id": windowId },
          });
        }
      }, 1);
    },
    [slides, windowId],
  );

  return (
    <>
      <Button
        onClick={open}
        onMouseDown={initializePresentation}
        data-roamjs-presentation2
        text="PRESENT 2"
      />
      <Overlay isOpen={showOverlay}>
        <div
          id="roamjs-presentation-container"
          data-roamjs-native-renderer
          style={{ height: "100%", width: "100%", zIndex: 2000 }}
        >
          <NativePresentationContent
            slides={slides}
            onClose={close}
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
}) => {
  const { blockUid, windowId } = getUidsFromButton(button);
  ReactDOM.render(
    <BlockErrorBoundary
      blockUid={blockUid}
      message="Error thrown when rendering Presentation 2. Reach out to support@roamjs.com for help with this message: {ERROR}"
    >
      <Presentation2 getSlides={getSlides} {...options} windowId={windowId} />
    </BlockErrorBoundary>,
    button.parentElement,
  );
};

export default Presentation2;
