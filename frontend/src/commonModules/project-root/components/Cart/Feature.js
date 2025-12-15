import styles from "./Feature.module.scss";

const Feature = ({ icon, title, info, extraClasses }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      <div className={styles["head"]}>
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <label>{title}</label>
      </div>
      {info && <p>{info}</p>}
    </div>
  );
};

export default Feature;
