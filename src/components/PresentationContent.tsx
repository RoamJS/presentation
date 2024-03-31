import { Button } from "@blueprintjs/core";
import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  Fragment,
  MouseEvent,
} from "react";
import Reveal from "reveal.js";
import addStyle from "roamjs-components/dom/addStyle";
import { TreeNode } from "roamjs-components/types";
import isControl from "roamjs-components/util/isControl";
import ContentSlide from "./ContentSlide";
import TitleSlide from "./TitleSlide";

const COLLAPSIBLE_REGEX =
  /(?:\[\[{|{\[\[|{)collapsible(:ignore)?(?:\]\]}|}\]\]|})/i;
const ANIMATE_REGEX = /(?:\[\[{|{\[\[|{)animate(?:\]\]}|}\]\]|})/i;
const TRANSITION_REGEX =
  /(?:\[\[{|{\[\[|{)transition:(none|fade|slide|convex|concave|zoom)(?:\]\]}|}\]\]|})/i;
const TITLE_REGEX = /(?:\[\[{|{\[\[|{)title(?:\]\]}|}\]\]|})/i;
const HIDE_REGEX = /(?:\[\[{|{\[\[|{)hide(?:\]\]}|}\]\]|})/i;
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

const filterHideBlocks = (s: TreeNode) => {
  s.children = s.children
    .filter((t) => !HIDE_REGEX.test(t.text))
    .map(filterHideBlocks);
  return s;
};
const observerCallback = (ms: MutationRecord[]) =>
  ms
    .map((m) => m.target as HTMLElement)
    .filter((m) => m.className === "present")
    .map(
      (s) =>
        s.getElementsByClassName(
          "roamjs-bullets-container"
        )[0] as HTMLDivElement
    )
    .filter((d) => !!d)
    .forEach((d) => {
      const containerHeight = d.offsetHeight;
      const containerWidth = d.offsetWidth;
      if (containerHeight > 0 && containerWidth > 0) {
        const contentHeight = (d.children[0] as HTMLElement)?.offsetHeight || 0;
        const contentWidth = (d.children[0] as HTMLElement)?.offsetWidth || 0;
        if (contentHeight > containerHeight || contentWidth > containerWidth) {
          const scale = Math.min(
            containerHeight / contentHeight,
            containerWidth / contentWidth
          );
          d.style.transform = `scale(${scale})`;
        } else {
          d.style.transform = "initial";
        }
      }
    });

export type ContentSlideExtras = {
  note: TreeNode;
  layout: string;
  collapsible: boolean;
  animate: boolean;
  transition: string;
  isTitle: boolean;
};
type RevealInstance = Reveal & {
  getRevealElement?: () => HTMLElement;
  getState?: () => { indexh: number };
  isPrintingPdf?: () => boolean;
};
type PresentationContent = {
  slides: TreeNode[];
  showNotes: boolean;
  onClose: (index: number) => void;
  globalCollapsible: boolean;
  globalAnimate: boolean;
  globalTransition: string;
  startIndex: number;
};

const PresentationContent = ({
  slides,
  showNotes,
  onClose,
  globalCollapsible,
  globalAnimate,
  globalTransition,
  startIndex,
}: PresentationContent) => {
  const revealRef = useRef<RevealInstance | null>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const mappedSlides = slides
    .filter((s) => !HIDE_REGEX.test(s.text))
    .map((s) => filterHideBlocks(s))
    .map((s) => {
      let layout = "default";
      let collapsible = globalCollapsible || false;
      let transition = globalTransition || undefined;
      let animate = globalAnimate || false;
      let isTitle = !s.children.length;
      const text = s.text
        .replace(
          new RegExp(
            `(?:\\[\\[{|{\\[\\[|{)layout:(${LAYOUTS.join(
              "|"
            )})(?:\\]\\]}|}\\]\\]|})`,
            "is"
          ),
          (_, capture) => {
            layout = capture;
            return "";
          }
        )
        .replace(COLLAPSIBLE_REGEX, (_, ignore) => {
          collapsible = !ignore;
          return "";
        })
        .replace(ANIMATE_REGEX, () => {
          animate = true;
          return "";
        })
        .replace(TRANSITION_REGEX, (_, val) => {
          transition = val;
          return "";
        })
        .replace(TITLE_REGEX, () => {
          isTitle = true;
          return "";
        })
        .trim();
      return {
        ...s,
        text,
        isTitle,
        layout,
        collapsible,
        animate,
        transition,
        children: showNotes
          ? s.children.slice(0, s.children.length - 1)
          : s.children,
        note: showNotes && s.children[s.children.length - 1],
      };
    });
  const onCloseClick = useCallback(
    (e: Event) => {
      if (
        !revealRef.current ||
        !revealRef.current.getRevealElement ||
        !revealRef.current.getState
      )
        return;

      revealRef.current.getRevealElement().style.display = "none";
      const state = revealRef.current.getState();
      if (!state) return;
      const actualStartIndex = slides.findIndex(
        (s) => s.uid === mappedSlides[state.indexh]?.uid
      );
      onClose(actualStartIndex);
      e.stopImmediatePropagation();
    },
    [onClose, revealRef, slides, mappedSlides]
  );
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
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
    const observer = new MutationObserver(observerCallback);
    if (!slidesRef.current) return;
    observer.observe(slidesRef.current, {
      attributeFilter: ["class"],
      subtree: true,
    });
    setInitialized(true);
    return () => observer.disconnect();
  }, [revealRef, slidesRef, setInitialized]);
  const bodyEscapePrint = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseClick(e);
      } else if (isControl(e) && e.key === "p" && !e.shiftKey && !e.altKey) {
        if (!revealRef.current) return;
        revealRef.current.isPrintingPdf = () => true;
        const injectedStyle = addStyle(`@media print {
    body * {
      visibility: hidden;
    }
    #roamjs-presentation-container #roamjs-reveal-root * {
      visibility: visible;
    }
    #roamjs-presentation-container * {
      position: absolute;
      left: 0;
      top: 0;
    }
  }`);
        const onAfterPrint = () => {
          if (!injectedStyle.parentElement) return;
          injectedStyle.parentElement.removeChild(injectedStyle);
          window.removeEventListener("afterprint", onAfterPrint);
        };
        window.addEventListener("afterprint", onAfterPrint);
        window.print();
        e.preventDefault();
      }
    },
    [onCloseClick, revealRef]
  );
  useEffect(() => {
    document.body.addEventListener("keydown", bodyEscapePrint);
    return () => document.body.removeEventListener("keydown", bodyEscapePrint);
  }, [bodyEscapePrint]);
  useEffect(() => {
    if (initialized && startIndex > 0) {
      const actualStartIndex = mappedSlides.findIndex(
        (s) => s.uid === slides[startIndex].uid
      );
      if (!revealRef.current) return;
      revealRef.current.slide(actualStartIndex);
    }
  }, [revealRef, initialized, startIndex, slides, mappedSlides]);
  return (
    <>
      <div className="reveal" id="roamjs-reveal-root">
        <div className="slides" ref={slidesRef}>
          {/* TODO: FIX THIS TYPE */}
          {mappedSlides.map((s: any, i) => (
            <Fragment key={i}>
              {s.isTitle ? (
                <TitleSlide
                  texts={[
                    { text: s.text, textAlign: s.textAlign },
                    ...s.children.map((ss: any) => ({
                      text: ss.text,
                      textAlign: ss.textAlign,
                    })),
                  ]}
                  note={s.note}
                  transition={s.transition}
                  animate={s.animate}
                />
              ) : (
                <ContentSlide {...s} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <Button
        icon={"cross"}
        onClick={(e: MouseEvent) => onCloseClick(e.nativeEvent)}
        minimal
        style={{ position: "absolute", top: 8, right: 8 }}
      />
    </>
  );
};
export default PresentationContent;
