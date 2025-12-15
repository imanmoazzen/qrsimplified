import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { activeHelpIdChanged } from "../store/uiReducer.js";
import styles from "./HelpCard.module.scss";

const HelpCard = ({ help, demoProjectId, setActiveHelpId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDisabled = help.hasDemoProjectDependency && !demoProjectId;
  const isStartRippling = help.id === "start" && !demoProjectId;

  const handleClick = () => {
    if (help.helpId) {
      dispatch(activeHelpIdChanged(help.helpId));
      navigate(!help.isOnDashboard ? `/project/${demoProjectId}` : "/");
    } else {
      help?.onClick();
    }
  };

  return (
    <div className={`${styles["main-container"]} ${isDisabled ? styles["disabled"] : ""}`}>
      {help.video && (
        <DecoratedButton
          icon="play_arrow"
          onClick={() => setActiveHelpId(help.id)}
          extraContainerClasses={styles["video-button-container"]}
          theme={BUTTON_THEMES.COLORED}
        />
      )}
      <img src={help.imgSource} alt="an interactive help" />
      <h3>{help.title}</h3>
      <p>{help.description}</p>
      <DecoratedButton
        buttonText={help.buttonText ?? "Start Guide"}
        icon={help.buttonIcon ?? "pan_tool_alt"}
        onClick={handleClick}
        isRippling={isStartRippling}
      />
    </div>
  );
};

export default HelpCard;
