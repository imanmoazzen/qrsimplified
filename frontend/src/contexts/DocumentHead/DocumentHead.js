/* eslint-disable */

import { useContext } from "react";
import { Helmet } from "react-helmet";

import { DocumentHeadContext } from "../DocumentHeadProvider.js";

const DocumentHead = () => {
  const documentHead = useContext(DocumentHeadContext);
  const { title, charset, description, keywords, author, viewport, openGraph, icon, themeColor } = documentHead;

  const {
    title: ogTitle,
    description: ogDescription,
    image: ogImage,
    url: ogUrl,
    type: ogType,
    locale: ogLocale,
  } = openGraph;

  return (
    <Helmet>
      <title>{title}</title>
      <meta charset={charset} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content={viewport} />
      {author && <meta name="author" content={author} />}
      {themeColor && <meta name="theme-color" content={themeColor} />}
      {icon && <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogType && <meta property="og:type" content={ogType} />}
      {ogLocale && <meta property="og:locale" content={ogLocale} />}
    </Helmet>
  );
};

export default DocumentHead;
