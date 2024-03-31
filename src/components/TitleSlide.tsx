import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextAlignment, TreeNode, ViewType } from "roamjs-components/types";
import Notes from "./Notes";
import { parseRoamBlocks } from "../utils/getParseRoamBlocks";

const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=$,]*)/;
export const SRC_REGEXES = {
  image: /!\[(.*)\]\((.*)\)/,
  iframe: new RegExp(
    `{{(?:\\[\\[)?iframe(?:\\]\\])?:\\s*(${URL_REGEX.source})}}`
  ),
  media: /$^/,
};
export const SRC_INDEX = {
  image: 2,
  iframe: 1,
  media: 0,
};
const IMG_MAX_WIDTH = 580;
const IMG_MAX_HEIGHT = 720;

export const parseSolo = ({
  text = "",
  textAlign = "left",
}: {
  text?: string;
  textAlign?: TextAlignment;
}): string =>
  parseRoamBlocks?.({
    content: [
      {
        text,
        order: 0,
        viewType: "document",
        children: [],
        uid: "",
        parents: [],
        heading: 0,
        open: true,
        textAlign,
        editTime: new Date(),
        props: { imageResize: {}, iframe: {} },
      },
    ],
    viewType: "document",
  });

export const getResizeStyle = (imageResize?: {
  width: number;
  height: number;
}) => {
  const widthPercentage = imageResize?.width
    ? Math.ceil((100 * imageResize.width) / IMG_MAX_WIDTH)
    : "auto";
  const heightPercentage = imageResize?.height
    ? (100 * imageResize.height) / IMG_MAX_HEIGHT
    : "auto";

  return {
    width:
      typeof widthPercentage === "number"
        ? `${widthPercentage}%`
        : widthPercentage,
    height:
      typeof heightPercentage === "number"
        ? `${heightPercentage}%`
        : heightPercentage,
  };
};

type SrcFromTextProps = {
  text: string;
  resizes?: {
    [link: string]: {
      height: number;
      width: number;
    };
  };
  type?: "image" | "iframe" | "media";
};
const SrcFromText: React.FunctionComponent<
  SrcFromTextProps & {
    Alt: React.FunctionComponent<SrcFromTextProps>;
  }
> = ({ text, Alt, resizes, type = "image" }) => {
  const match = text.match(SRC_REGEXES[type] || "");
  const [style, setStyle] = useState({});
  const srcRef = useRef<HTMLImageElement | HTMLIFrameElement>(null);
  const srcResize = match && resizes && resizes[match[SRC_INDEX[type]]];
  const srcOnLoad = useCallback(() => {
    if (srcResize) {
      setStyle(getResizeStyle(srcResize));
    } else if (srcRef.current?.parentElement) {
      const srcWidth = Number(
        getComputedStyle(srcRef.current).width.replace(/px$/, "")
      );
      const srcHeight = Number(
        getComputedStyle(srcRef.current).height.replace(/px$/, "")
      );
      const srcAspectRatio = srcWidth / srcHeight;
      const containerWidth = srcRef.current.parentElement.offsetWidth;
      const containerHeight = srcRef.current.parentElement.offsetHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      if (!isNaN(srcAspectRatio) && !isNaN(srcAspectRatio)) {
        if (srcAspectRatio > containerAspectRatio) {
          setStyle({
            width: "100%",
            height: `${(srcHeight * containerWidth) / srcWidth}px`,
          });
        } else {
          setStyle({
            height: "100%",
            width: `${(srcWidth * containerHeight) / srcHeight}px`,
          });
        }
      }
    }
  }, [setStyle, srcRef, srcResize]);
  useEffect(() => {
    if (srcRef.current) {
      srcRef.current.onload = srcOnLoad;
    }
  }, [srcOnLoad, srcRef]);
  return type === "media" ? (
    <div
      ref={srcRef}
      dangerouslySetInnerHTML={{
        __html: parseRoamBlocks({ viewType: "document", content: [] }),
      }}
    />
  ) : match ? (
    <>
      <span
        style={{
          display: "inline-block",
          verticalAlign: "middle",
          height: "100%",
        }}
      />
      {type === "image" && (
        <img
          alt={match[1]}
          src={match[2]}
          ref={srcRef as React.RefObject<HTMLImageElement>}
          style={style}
        />
      )}
      {type === "iframe" && (
        <iframe
          frameBorder={0}
          src={match[1]}
          ref={srcRef as React.RefObject<HTMLIFrameElement>}
          style={style}
        />
      )}
    </>
  ) : (
    <Alt text={text} />
  );
};

const TitleSlide = ({
  texts,
  note,
  transition,
  animate,
}: {
  texts: Partial<TreeNode>[];
  note: TreeNode;
  transition: string;
  animate: boolean;
}) => {
  const text = texts[0];
  const type = (Object.keys(SRC_REGEXES) as (keyof typeof SRC_REGEXES)[]).find(
    (k) => SRC_REGEXES[k].test(text.text || "")
  );
  const props = {
    ...(type ? { style: { bottom: 0 } } : {}),
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section {...props}>
      <SrcFromText
        text={text.text || ""}
        Alt={() => (
          <>
            {texts.map((t, i) =>
              i === 0 ? (
                <h1
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseSolo(t),
                  }}
                />
              ) : (
                <h3
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseSolo(t),
                  }}
                />
              )
            )}
          </>
        )}
        type={type}
      />
      <Notes note={note} />
    </section>
  );
};
export default TitleSlide;
