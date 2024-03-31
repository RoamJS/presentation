import React, { useEffect, useRef } from "react";

export const Embed = ({ uid }: { uid: string }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      window.roamAlphaAPI.ui.components.renderBlock({
        uid,
        el,
      });
    }
  }, [uid, contentRef]);
  return <div ref={contentRef} />;
};
