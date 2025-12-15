import { useNavigate } from "react-router";

import DecoratedButton, { BUTTON_THEMES } from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";

const BackToPreviousPage = ({ extraClasses }) => {
  const navigate = useNavigate();
  return (
    <DecoratedButton
      onClick={() => navigate(-1)}
      icon="arrow_back"
      buttonText="Back"
      extraClasses={extraClasses}
      theme={BUTTON_THEMES.TRANSPARENT}
    />
  );
};

export default BackToPreviousPage;
