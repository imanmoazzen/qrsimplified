import { useId } from "react";

import styles from "./Modal.module.css";

const NotificationModal = ({ active, onOk, title, children }) => {
  const ok = () => {
    onOk?.();
  };

  const notificationModalId = useId();

  return (
    <>
      <div className={`${styles["modal"]} ${active ? styles["active"] : ""}`} id={notificationModalId}>
        <div className={styles["modal-header"]}>
          <div className={styles["title"]}> {title} </div>
          <button className={`material-symbols-outlined ${styles["close-button"]}`} onClick={ok}>
            close
          </button>
        </div>

        {children}

        <div className={styles["buttons"]}>
          <button onClick={ok} className={styles["cancel"]}>
            OK
          </button>
        </div>
      </div>

      <div className={`${styles["overlay"]} ${active ? styles["active"] : ""}`} onClick={ok}></div>
    </>
  );
};

export default NotificationModal;
