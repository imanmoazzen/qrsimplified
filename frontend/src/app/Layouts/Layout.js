import styles from "./Layout.module.scss";

const Layout = ({ content, isReadOnly, isBusy }) => {
  return (
    <div className={`${styles["main-container"]} ${isReadOnly ? styles["viewer"] : ""} ${isBusy && styles["busy"]}`}>
      <header className={`${styles["element"]} ${styles["navigation"]}`}>
        <div className={`${styles["element"]} ${styles["logo"]}`}>{content?.logo}</div>
        <div className={`${styles["element"]} ${styles["undo-redo"]}`}>{content?.undoRedo}</div>
        <div className={`${styles["element"]} ${styles["title"]}`}>{content?.title}</div>
        <div className={`${styles["element"]} ${styles["cta-buttons"]}`}>{content?.ctaButtons}</div>
        <div className={`${styles["element"]} ${styles["user-menu"]}`}>{content?.userMenu}</div>
      </header>

      <main className={`${styles["element"]} ${styles["core-panel"]}`}>
        <div className={`${styles["element"]} ${styles["toolbox"]}`}>{content?.toolbox}</div>
        <div className={`${styles["element"]} ${styles["scrollable-content"]}`}>{content?.core}</div>
      </main>
    </div>
  );
};

export default Layout;
