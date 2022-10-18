declare module "reveal.js" {
  type RevealOptions = {
    embedded?: boolean;
    slideNumber?: string;
    width?: number;
    height?: number;
    showNotes?: boolean;
    minScale?: number;
    maxScale?: number;
    backgroundTransition?: string;
  };
  class Reveal {
    constructor(options: RevealOptions);
    initialize: () => void;
    slide: (h: number) => void;
    on: (s: string, callback: () => void) => void;
  }
  export default Reveal;
}
