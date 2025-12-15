import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { APP_PAGES } from "../../frontEndConstants.js";
import DecoratedButton, { BUTTON_THEMES } from "../DecoratedButton/DecoratedButton.js";
import PopupMenu from "../PopupMenu/PopupMenu.js";
import UserCircle from "../UserCircle/UserCircle.js";
import styles from "./UserMenu.module.scss";

const UserMenu = ({ authModule }) => {
  const navigate = useNavigate();
  const [popupVisible, setPopupVisible] = useState(false);
  const user = useSelector(authModule.userSelector);
  const isAnonymous = useSelector(authModule.isAnonymousSelector);

  const { user_id, display_name, picture, user_uploaded_picture } = user;

  const pricingClicked = () => {
    setPopupVisible(false);
    navigate(APP_PAGES.CART);
  };

  const helpClicked = () => {
    setPopupVisible(false);
    navigate(APP_PAGES.FAQ);
  };

  const feedbackClicked = () => {
    setPopupVisible(false);
    navigate(APP_PAGES.FEEDBACK);
  };

  return (
    <div className={styles["main-container"]}>
      <div onClick={() => setPopupVisible(!popupVisible)} className={styles["top-container"]}>
        <UserCircle
          otherClasses={styles["user-circle"]}
          name={display_name}
          id={user_id}
          picture={user_uploaded_picture ?? picture}
        />
        <DecoratedButton
          icon={popupVisible ? "arrow_drop_up" : "arrow_drop_down"}
          buttonText={display_name}
          extraClasses={styles["user-button"]}
        />
      </div>

      <PopupMenu setIsVisible={setPopupVisible} isVisible={popupVisible} containerClass={styles["popup-menu"]}>
        <>
          {!isAnonymous && (
            <>
              <DecoratedButton
                icon={"shopping_cart"}
                buttonText={"Cart"}
                onClick={pricingClicked}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"help"}
                buttonText={"Help"}
                onClick={helpClicked}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"forum"}
                buttonText={"Feedback"}
                onClick={feedbackClicked}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"logout"}
                buttonText={"Log out"}
                onClick={() => authModule.signOut()}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
            </>
          )}
          {isAnonymous && (
            <>
              <DecoratedButton
                icon={"login"}
                buttonText={"Log In"}
                onClick={() => authModule.redirectToLogin(window.location.pathname)}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"person_add"}
                buttonText={"Sign Up"}
                onClick={() => authModule.redirectToLogin(window.location.pathname, true)}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"help"}
                buttonText={"Help"}
                onClick={helpClicked}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
              <DecoratedButton
                icon={"shopping_cart"}
                buttonText={"Cart"}
                onClick={pricingClicked}
                theme={BUTTON_THEMES.POPUP}
                extraContainerClasses={styles["button-container"]}
              />
            </>
          )}
        </>
      </PopupMenu>
    </div>
  );
};

export default UserMenu;
