import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import styles from "./Filter.module.scss";

const Filter = ({ icon, title, items, activeItem, onChange }) => {
  return (
    <div className={styles["main-container"]}>
      <div className={styles["header"]}>
        <span className="material-symbols-outlined">{icon}</span>
        <label className={styles["title"]}>{title}</label>
      </div>
      <div className={styles["buttons-container"]}>
        {Object.keys(items).map((key) => {
          const value = items[key];

          return (
            <DecoratedButton
              buttonText={value}
              extraClasses={`${styles["button"]} ${value === activeItem ? styles["active"] : ""}`}
              theme={value === activeItem ? BUTTON_THEMES.COLORED : BUTTON_THEMES.TRANSPARENT}
              onClick={() => onChange?.(value)}
              key={key}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Filter;
