import { useEffect, useId } from "react";

import DecoratedButton from "../DecoratedButton/DecoratedButton.js";
import Overlay from "../Overlay/Overlay.js";
import styles from "./Modal.module.scss";

const Modal = ({
  active,
  setActive,
  extraClasses = "",
  onOpen,
  beforeClose,
  onConfirm,
  onCancel,
  title,
  children,
  isCancelConfirmButtonRequired = false,
  isCloseButtonRequired = true,
  overlayCancels = true,
  confirmButtonText = "Confirm",
  isConfirmDisabled = false,
}) => {
  const cancel = () => {
    setActive(false);
    beforeClose?.();
    onCancel?.();
  };

  const modalId = useId();

  useEffect(() => {
    if (active) onOpen?.();
  }, [active]);

  if (!active) return;

  return (
    <>
      <div className={`${styles["modal"]} ${extraClasses} ${active ? styles["active"] : ""}`} id={modalId}>
        <div className={styles["header"]}>
          {isCloseButtonRequired && (
            <button className={`material-symbols-outlined ${styles["close-button"]}`} onClick={cancel}>
              close
            </button>
          )}
          {title && <h3 className={styles["title"]}>{title}</h3>}
        </div>

        {children}
        {isCancelConfirmButtonRequired && (
          <div className={styles["button-group"]}>
            <DecoratedButton buttonText="Cancel" onClick={cancel} />

            <DecoratedButton
              buttonText={confirmButtonText}
              onClick={() => {
                if (!isConfirmDisabled) {
                  setActive(false);
                  onConfirm?.();
                }
              }}
              isDisabled={isConfirmDisabled}
            />
          </div>
        )}
      </div>

      <Overlay
        isActive={active}
        isCloseButtonRequired={isCloseButtonRequired}
        onClick={overlayCancels ? () => cancel() : null}
      />
    </>
  );
};

export default Modal;
