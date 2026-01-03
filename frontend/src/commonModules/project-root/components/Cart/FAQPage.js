import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import { useFadeInImage } from "../../../../hooks/useFadeInImage.js";
import Demo from "../../../campaign/components/Demo/Demo.js";
import styles from "./FAQPage.module.scss";
import { FAQs } from "./FAQs.js";

const FAQPage = () => {
  const navigate = useNavigate();

  const helpImg = useFadeInImage({ src: ILLUSTRATIONS.FAQ, alt: "FAQ image", extraImgStyle: { width: 256 } });

  return (
    <>
      <div className={styles["main-container"]}>
        <DecoratedButton
          buttonText={"Close"}
          icon={"close"}
          onClick={() => navigate("/")}
          extraContainerClasses={styles["close-container"]}
          theme={BUTTON_THEMES.TRANSPARENT}
        />

        <Demo />

        <FAQs isInitiallyOpen={true} extraClasses={styles["faq"]} />

        {helpImg}
      </div>
    </>
  );
};

export default FAQPage;
