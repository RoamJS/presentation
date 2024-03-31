import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { SRC_INDEX, SRC_REGEXES, getResizeStyle } from "./TitleSlide";
import { parseRoamBlocks } from "../utils/getParseRoamBlocks";

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

export default SrcFromText;
