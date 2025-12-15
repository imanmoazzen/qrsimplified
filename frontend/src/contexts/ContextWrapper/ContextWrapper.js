import DocumentHead from "../DocumentHead/DocumentHead.js";
import DocumentHeadProvider from "../DocumentHeadProvider.js";
import FontsProvider from "../Fonts/FontsProvider.js";

const ContextWrapper = ({ children }) => {
  return (
    <DocumentHeadProvider>
      <FontsProvider>
        <DocumentHead />
        {children}
      </FontsProvider>
    </DocumentHeadProvider>
  );
};

export default ContextWrapper;
