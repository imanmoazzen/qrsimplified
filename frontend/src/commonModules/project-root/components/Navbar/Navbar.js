import { useNavigate } from "react-router-dom";

import UserMenu from "../../../../commonComponents/UserMenu/UserMenu.js";
import { auth } from "../../../../index.js";
import Logo from "../Logo/Logo.js";
import styles from "./Navbar.module.scss";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div className={styles["main-container"]}>
      <Logo text="SIMPLIFIED" onClick={() => navigate("/")} />
      <UserMenu authModule={auth} />
    </div>
  );
};

export default Navbar;
