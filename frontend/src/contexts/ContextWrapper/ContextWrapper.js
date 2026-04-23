import DocumentHead from "../DocumentHead/DocumentHead.js";
import DocumentHeadProvider from "../DocumentHeadProvider.js";

const ContextWrapper = ({ children }) => {
  return (
    <DocumentHeadProvider>
      <DocumentHead />
      {children}
    </DocumentHeadProvider>
  );
};

export default ContextWrapper;
