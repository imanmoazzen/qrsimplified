import { useDispatch, useSelector } from "react-redux";

import Modal from "../../../commonComponents/Modal/Modal.js";
import { setRequestSignupModalVisible } from "../store/uiReducer.js";
import styles from "./RequestSignupModal.module.css";

const RequestSignupModal = ({ module }) => {
  const dispatch = useDispatch();
  const isActive = useSelector(module.signupModalVisibleSelector);

  const setIsActive = (active) => {
    dispatch(setRequestSignupModalVisible(active));
  };

  const deactivateAndRedirect = () => {
    setIsActive(false);
    module.redirectToLogin();
  };

  return (
    <Modal title="Please Sign up" active={isActive} setActive={setIsActive}>
      <p>To access full functionality, you can sign up for free!</p>
      <p>Your work so far has been saved.</p>
      <div className={styles["spacer"]}>
        <button className={styles["modal-button"]} onClick={() => deactivateAndRedirect()}>
          Sign in / Sign up
        </button>
      </div>
    </Modal>
  );
};

export default RequestSignupModal;
