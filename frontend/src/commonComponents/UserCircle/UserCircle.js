import { stringToHashRange } from "castofly-common/hash.js";

import ProfilePicture from "../ProfilePicture/ProfilePicture.js";
import styles from "./UserCircle.module.css";

const CIRCLE_COLORS = ["#EF476F", "#E63946", "#06D6A0", "#068CA0", "#1138A1", "#FAAB3D", "#F5771B"];

const UserCircle = ({ otherClasses, name, id = "", picture }) => {
  if (picture) {
    return <ProfilePicture imgSrc={picture} extraClasses={`${otherClasses}`} />;
  } else {
    const colorIndex = stringToHashRange(id, 0, CIRCLE_COLORS.length);
    const color = CIRCLE_COLORS[colorIndex];

    return (
      <div
        className={`${styles["user-circle"]} ${otherClasses}`}
        style={{ backgroundColor: color }}
        data-tip
        data-for={"connectedUser" + name}
      >
        {name ? name.charAt(0).toUpperCase() : "★"}
      </div>
    );
  }
};

export default UserCircle;
