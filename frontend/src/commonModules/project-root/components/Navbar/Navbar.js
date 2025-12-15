import { useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import UserMenu from "../../../../commonComponents/UserMenu/UserMenu.js";
import { APP_PAGES } from "../../../../frontEndConstants.js";
import { auth } from "../../../../index.js";
import Logo from "../Logo/Logo.js";
import styles from "./Navbar.module.scss";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div className={styles["main-container"]}>
      <Logo text="SIMPLIFIED" onClick={() => navigate("/")} />
      <DecoratedButton
        icon="redeem"
        buttonText={"Refer & Earn Cash"}
        extraClasses={styles["refer-button"]}
        onClick={() => navigate(APP_PAGES.REFERRAL)}
      />
      <UserMenu authModule={auth} />
    </div>
  );
};

export default Navbar;
