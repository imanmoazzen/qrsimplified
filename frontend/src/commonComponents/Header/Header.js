import styles from "./Header.module.scss";

const Header = ({ icon, title, info, extraClasses, children }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      <h2>
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        {title}
      </h2>
      {info && <span className="header-text-subtitle">{info}</span>}
      {children}
    </div>
  );
};

export default Header;
