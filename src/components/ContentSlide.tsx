import React, { useRef, useState, useEffect, useCallback } from "react";
import { Dialog } from "@blueprintjs/core";
import { TreeNode, ViewType } from "roamjs-components/types";
import { ContentSlideExtras } from "./PresentationContent";
import { getResizeStyle, parseSolo } from "./TitleSlide";
import Notes from "./Notes";
import SrcFromText from "./SrcFromText";
import { parseRoamBlocks } from "../utils/getParseRoamBlocks";
import { Embed } from "./Embed";

const STARTS_WITH_IMAGE = new RegExp("^image ", "i");
const STARTS_WITH_IFRAME = new RegExp("^iframe ", "i");
const STARTS_WITH_MEDIA = new RegExp("^media ", "i");
const ENDS_WITH_LEFT = new RegExp(" left$", "i");
const ENDS_WITH_CENTER = new RegExp(" center$", "i");

type LinkResize = {
  [link: string]: {
    height: number;
    width: number;
  };
};

const findLinkResize = ({
  src,
  slides,
  field,
}: {
  slides: TreeNode[];
  src: string;
  field: "imageResize" | "iframe";
}): LinkResize => {
  if (slides.length === 0) {
    return {};
  }
  const slideWithImage = slides.find((s) => s.text.includes(src));
  if (slideWithImage) {
    return slideWithImage.props[field];
  }
  return findLinkResize({
    src,
    slides: slides.flatMap((s) => s.children),
    field,
  });
};
const setDocumentLis = ({
  e,
  s,
  v,
}: {
  e: HTMLElement;
  s: TreeNode[];
  v: ViewType;
}): void => {
  Array.from(e.children).forEach((element, i) => {
    const li = element as HTMLLIElement;
    const lastChild = li.lastElementChild as HTMLElement;
    if (["UL", "OL"].includes(lastChild?.tagName)) {
      setDocumentLis({ e: lastChild, s: s[i].children, v: s[i].viewType });
    }
    if (v === "document") {
      li.classList.add("roamjs-document-li");
    }
  });
};

const ContentSlide = ({
  text,
  textAlign,
  children,
  note,
  layout,
  collapsible,
  viewType,
  animate,
  transition,
}: TreeNode & ContentSlideExtras) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(layout);
  const isIframeLayout = STARTS_WITH_IFRAME.test(layout);
  const isMediaLayout = STARTS_WITH_MEDIA.test(layout);
  const isSourceLayout = isImageLayout || isIframeLayout || isMediaLayout;
  const isLeftLayout = ENDS_WITH_LEFT.test(layout);
  const isCenterLayout = ENDS_WITH_CENTER.test(layout);
  const bullets = isSourceLayout ? children.slice(1) : children;
  const slideRoot = useRef<HTMLDivElement>(null);
  const [htmlEditsLoaded, setHtmlEditsLoaded] = useState(false);
  const [imageDialogSrc, setImageDialogSrc] = useState("");
  useEffect(() => {
    if (!htmlEditsLoaded) {
      if (collapsible) {
        if (!slideRoot.current) return;
        const lis = Array.from(slideRoot.current.getElementsByTagName("li"));
        let minDepth = Number.MAX_VALUE;
        lis.forEach((l) => {
          if (
            l.getElementsByTagName("ul").length ||
            l.getElementsByTagName("ol").length
          ) {
            const spanIcon = document.createElement("span");
            spanIcon.className =
              "bp3-icon bp3-icon-caret-right roamjs-collapsible-caret";
            l.style.position = "relative";
            l.insertBefore(spanIcon, l.childNodes[0]);
            l.classList.add("roamjs-collapsible-bullet");
          }
          let depth = 0;
          let parentElement = l as HTMLElement;
          while (parentElement && parentElement !== slideRoot.current) {
            const nextParentElement = parentElement.parentElement;
            if (nextParentElement) {
              parentElement = nextParentElement;
              depth++;
            }
          }
          minDepth = Math.min(minDepth, depth);
          l.setAttribute("data-dom-depth", depth.toString());
        });
        lis.forEach((l) => {
          const depth = parseInt(l.getAttribute("data-dom-depth") || "0");
          if (depth === minDepth) {
            l.style.display = "list-item";
          } else {
            l.style.display = "none";
          }
        });
      }
      if (!slideRoot.current) return;
      Array.from(slideRoot.current.getElementsByTagName("a")).forEach((a) => {
        a.target = "_blank";
        a.rel = "noreferrer";
      });
      Array.from(slideRoot.current.getElementsByTagName("img")).forEach(
        (img) => {
          const src = img.src;
          const resizeProps = findLinkResize({
            src,
            slides: children,
            field: "imageResize",
          });
          const { width, height } = getResizeStyle(resizeProps[src]);
          img.style.width = width;
          img.style.height = height;

          const item = img.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("iframe")).forEach(
        (iframe) => {
          const src = iframe.src;
          const resizeProps = findLinkResize({
            src,
            slides: children,
            field: "iframe",
          });
          const { width, height } = resizeProps[src] || {};
          iframe.width = `${width || 500}px`;
          iframe.height = `${height || 500}px`;

          const item = iframe.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("blockquote")).forEach(
        (bq) => {
          const item = bq.closest<HTMLLIElement>("li");
          if (item) item.style.listStyle = "none";
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("table")).forEach(
        (t) => {
          const item = t.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
        }
      );
      if (!slideRoot.current.parentElement) return;
      Array.from(
        slideRoot.current.parentElement.querySelectorAll<HTMLDivElement>(
          "div.roam-render"
        )
      ).forEach((el) => {
        if (!el.parentElement) return;
        window.roamAlphaAPI.ui.components.renderBlock({
          uid: el.parentElement.id,
          el,
        });
        setTimeout(() => {
          Array.from(
            el.querySelectorAll<HTMLDivElement>("div.excalidraw-host")
          ).forEach((d) => {
            const style = getComputedStyle(d);
            const rect = d.getElementsByTagName("rect")[0];
            if (style.height.startsWith("0") && rect) {
              d.style.height = `${rect.height.animVal.valueAsString}px`;
            }
            if (style.width.startsWith("0") && rect) {
              d.style.width = `${rect.width.animVal.valueAsString}px`;
            }

            const clientWidth = Number(d.style.width.replace("px", ""));
            const clientHeight = Number(d.style.height.replace("px", ""));
            const parent =
              d.closest(".roamjs-bullets-container") ||
              d.closest(".roamjs-media-container");
            if (parent) {
              const containerWidth = parent.clientWidth;
              const containerHeight = parent.clientHeight;
              if (
                clientWidth / clientHeight <
                containerWidth / containerHeight
              ) {
                d.style.height = `${containerHeight}px`;
                d.style.width = `${
                  (containerHeight * clientWidth) / clientHeight
                }px`;
              } else if (
                clientWidth / clientHeight >
                containerWidth / containerHeight
              ) {
                d.style.height = `${
                  (containerWidth * clientHeight) / clientWidth
                }px`;
                d.style.width = `${containerWidth}px`;
              } else {
                d.style.height = `${containerHeight}px`;
                d.style.width = `${containerWidth}px`;
              }
            }

            d.style.maxWidth = "100%";
            d.style.resize = "unset";
            const roamBlock = d.closest<HTMLDivElement>(".roam-block");
            if (roamBlock) {
              roamBlock.style.minWidth = "100%";
            }
          });
        }, 1);

        const item = el.closest<HTMLLIElement>("li");
        if (item) item.classList.add("roamjs-document-li");
      });
      setHtmlEditsLoaded(true);
    }
  }, [
    collapsible,
    slideRoot.current,
    htmlEditsLoaded,
    setHtmlEditsLoaded,
    children,
  ]);
  useEffect(() => {
    if (bullets.length) {
      if (!slideRoot.current) return;
      setDocumentLis({
        e: slideRoot.current.firstElementChild as HTMLElement,
        s: bullets,
        v: viewType,
      });
    }
  }, [bullets, slideRoot.current, viewType]);
  const onRootClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        setImageDialogSrc((target as HTMLImageElement).src);
      } else if (collapsible) {
        const className = target.className;
        if (className.includes("roamjs-collapsible-caret")) {
          let minDepth = Number.MAX_VALUE;
          if (!target.parentElement) return;
          const lis = Array.from(
            target.parentElement.getElementsByTagName("li")
          );
          lis.forEach((l) => {
            const depth = parseInt(l.getAttribute("data-dom-depth") || "0");
            minDepth = Math.min(depth, minDepth);
          });
          const lisToRestyle = lis.filter(
            (l) =>
              parseInt(l.getAttribute("data-dom-depth") || "0") === minDepth
          );
          if (className.includes("bp3-icon-caret-right")) {
            target.className = className.replace(
              "bp3-icon-caret-right",
              "bp3-icon-caret-down"
            );
            lisToRestyle.forEach((l) => (l.style.display = "list-item"));
          } else if (className.includes("bp3-icon-caret-down")) {
            target.className = className.replace(
              "bp3-icon-caret-down",
              "bp3-icon-caret-right"
            );
            lisToRestyle.forEach((l) => (l.style.display = "none"));
          }
        }
      }
    },
    [collapsible, setImageDialogSrc]
  );
  const onDialogClose = useCallback(
    () => setImageDialogSrc(""),
    [setImageDialogSrc]
  );

  const props = {
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section style={{ textAlign: "left" }} {...props}>
      <h1
        dangerouslySetInnerHTML={{
          __html: parseSolo({ text, textAlign }),
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: isLeftLayout ? "row-reverse" : "row",
        }}
        className="r-stretch"
        onClick={onRootClick}
      >
        <div className={"roamjs-bullets-container"}>
          {bullets.map((b) => (
            <Embed key={b.uid} uid={b.uid} />
          ))}
        </div>
        <div
          className={"roamjs-bullets-container"}
          dangerouslySetInnerHTML={{
            __html: parseRoamBlocks({ content: bullets, viewType }),
          }}
          style={{
            width: isImageLayout ? "50%" : "100%",
            transformOrigin: "left top",
            wordBreak: "break-word",
            display: isCenterLayout ? "none" : "block",
          }}
          ref={slideRoot}
        />
        {isSourceLayout && (
          <div
            style={{
              width: isCenterLayout ? "100%" : "50%",
              textAlign: "center",
              alignSelf: "center",
              height: "100%",
            }}
            className={"roamjs-media-container"}
          >
            {isMediaLayout ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: parseRoamBlocks({
                    viewType: "document",
                    content: children.slice(0, 1),
                  }),
                }}
              />
            ) : (
              <SrcFromText
                text={children[0].text}
                Alt={() => <div />}
                resizes={
                  isMediaLayout
                    ? {}
                    : children[0].props[
                        isIframeLayout ? "iframe" : "imageResize"
                      ]
                }
                type={
                  isIframeLayout ? "iframe" : isMediaLayout ? "media" : "image"
                }
              />
            )}
          </div>
        )}
      </div>
      <Notes note={note} />
      <Dialog
        isOpen={!!imageDialogSrc}
        onClose={onDialogClose}
        portalClassName={"roamjs-presentation-img-dialog"}
        style={{ paddingBottom: 0 }}
      >
        <img src={imageDialogSrc} />
      </Dialog>
    </section>
  );
};

export default ContentSlide;
