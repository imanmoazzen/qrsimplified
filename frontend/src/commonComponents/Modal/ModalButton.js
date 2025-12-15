import { useState } from "react";

import DecoratedButton from "../DecoratedButton/DecoratedButton.js";
import Modal from "./Modal.js";

const ModalButton = (props) => {
  const { buttonText, icon, theme, buttonExtraClasses } = props;
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <DecoratedButton
        onClick={() => setIsActive(!isActive)}
        buttonText={buttonText}
        icon={icon}
        extraClasses={buttonExtraClasses}
        theme={theme}
      />
      <Modal active={isActive} setActive={setIsActive} {...props} />
    </>
  );
};

export default ModalButton;
