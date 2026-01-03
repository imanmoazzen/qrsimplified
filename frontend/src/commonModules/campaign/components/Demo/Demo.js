import { useState } from "react";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Modal from "../../../../commonComponents/Modal/Modal.js";
import styles from "./Demo.module.scss";
import videoDemo from "./video-demo.mp4";

const Demo = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <DecoratedButton onClick={() => setIsActive(!isActive)} buttonText="Watch Quick Demo" icon="play_circle" />
      <Modal active={isActive} setActive={setIsActive}>
        <div className={styles["video-container"]}>
          <video autoPlay className={styles["video"]} src={videoDemo} controls />
        </div>
      </Modal>
    </>
  );
};

export default Demo;
