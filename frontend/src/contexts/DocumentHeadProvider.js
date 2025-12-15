import { createContext, useMemo, useState } from "react";

import { DOCUMENT_HEAD_META } from "../frontEndConstants.js";

export const DocumentHeadContext = createContext(null);

const DocumentHeadProvider = ({ children }) => {
  const [contextState, setContextState] = useState({
    title: DOCUMENT_HEAD_META.TITLE,
    charset: DOCUMENT_HEAD_META.CHARSET,
    description: DOCUMENT_HEAD_META.DESCRIPTION,
    keywords: null,
    author: null,
    viewport: DOCUMENT_HEAD_META.VIEWPORT,
    icon: null,
    themeColor: null,
    openGraph: {
      image: null,
      title: null,
      description: null,
      url: null,
      type: null,
      locale: null,
    },
  });

  const state = useMemo(() => {
    const setDocumentMeta = (newState) => {
      setContextState({
        ...contextState,
        ...newState,
      });
    };

    return {
      ...contextState,
      setDocumentMeta,
    };
  }, [contextState]);

  return <DocumentHeadContext.Provider value={state}>{children}</DocumentHeadContext.Provider>;
};

export default DocumentHeadProvider;
