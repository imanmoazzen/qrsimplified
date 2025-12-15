import styles from "./DefaultContainer.module.scss";

const DefaultContainer = ({ title, subtitle, id, children, extraClasses }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`} id={id}>
      <div className={styles["title-container"]}>
        <h2>{title}</h2>
        {subtitle && <label>{subtitle}</label>}
      </div>

      {children}
    </div>
  );
};

export default DefaultContainer;
