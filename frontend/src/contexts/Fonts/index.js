export const FONT_FAMILIES = {
  "Merriweather": {
    bold: {
      normal: "merriweather/merriweather-bold.woff2",
      italic: "merriweather/merriweather-bold-italic.woff2",
    },
    normal: {
      normal: "merriweather/merriweather-regular.woff2",
      italic: "merriweather/merriweather-regular-italic.woff2",
    },
  },
  "Montserrat": {
    normal: {
      normal: "montserrat/montserrat-regular.woff2",
      italic: "montserrat/montserrat-regular-italic.woff2",
    },
    bold: {
      normal: "montserrat/montserrat-bold.woff2",
      italic: "montserrat/montserrat-bold-italic.woff2",
    },
  },
  "Playfair Display": {
    normal: {
      normal: "playfair-display/playfair-display-regular.woff2",
      italic: "playfair-display/playfair-display-regular-italic.woff2",
    },
    bold: {
      normal: "playfair-display/playfair-display-bold.woff2",
      italic: "playfair-display/playfair-display-bold-italic.woff2",
    },
  },
  "Roboto": {
    normal: {
      normal: "roboto/roboto-regular.woff2",
      italic: "roboto/roboto-regular-italic.woff2",
    },
    bold: {
      normal: "roboto/roboto-bold.woff2",
      italic: "roboto/roboto-bold-italic.woff2",
    },
  },
  "Ubuntu": {
    normal: {
      normal: "ubuntu/ubuntu-regular.woff2",
      italic: "ubuntu/ubuntu-regular-italic.woff2",
    },
    bold: {
      normal: "ubuntu/ubuntu-bold.woff2",
      italic: "ubuntu/ubuntu-bold-italic.woff2",
    },
  },
};

export const FONT_PICKER_OPTIONS = Object.keys(FONT_FAMILIES).map((family) => family);

export const loadFontFaces = (fonts, setAllFontsReady) => {
  setAllFontsReady(false);
  Object.entries(fonts).forEach((font) => {
    const isFontActive = font[1];
    if (isFontActive) {
      const fontFamily = font[0];
      Object.entries(FONT_FAMILIES[fontFamily]).forEach((weight) => {
        const fontWeight = weight[0];
        const fontStyles = weight[1];
        Object.entries(fontStyles).forEach((style) => {
          const fontStyle = style[0];
          const fontSource = style[1];
          const stagedFont = new FontFace(fontFamily, `url("${process.env.PUBLIC_URL}/fonts/${fontSource}")`, {
            style: fontStyle,
            weight: fontWeight,
          });

          if (document.fonts.check(`16px ${fontFamily}`)) return;
          document.fonts.add(stagedFont);
          stagedFont.load();
        });
      });

      document.fonts.ready.then(() => {
        setAllFontsReady(true);
      });
    }
  });
};
