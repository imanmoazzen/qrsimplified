import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { useSelector } from "react-redux";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import { auth } from "../../../../index.js";
import styles from "./StripeReturnPage.module.scss";

const StripeReturnPage = () => {
  const mainContainerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const user = useSelector(auth.userSelector);
  const qr_credits = user?.qr_credits;

  useEffect(() => {
    if (mainContainerRef.current) {
      const { width, height } = mainContainerRef.current.getBoundingClientRect();
      setSize({ width, height });
    }
  }, []);

  return (
    <div ref={mainContainerRef} className={styles["main-container"]}>
      <img className={styles["illustration"]} src={ILLUSTRATIONS.CAMPAIGN} alt="thank you" />
      <Header title="Thank You!">
        <span>
          You can now create {qr_credits === 1 ? "one" : `up to ${qr_credits}`} lifetime QR code
          {qr_credits !== 1 ? "s" : ""}.
        </span>
      </Header>

      <DecoratedButton
        icon="home"
        buttonText="Go to Dashboard"
        onClick={() => (window.location = window.location.origin)}
        isRippling={true}
      />
      <Confetti recycle={false} numberOfPieces={1000} width={size?.width} height={size?.height} />
    </div>
  );
};

export default StripeReturnPage;
