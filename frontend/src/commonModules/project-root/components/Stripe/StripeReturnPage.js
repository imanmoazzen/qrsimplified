import confetti from "canvas-confetti";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import { auth } from "../../../../index.js";
import styles from "./StripeReturnPage.module.scss";

const StripeReturnPage = () => {
  const user = useSelector(auth.userSelector);
  const qr_credits = user?.qr_credits;

  useEffect(() => {
    confetti({
      particleCount: 250,
      spread: 70,
      scalar: 0.6,
    });
  }, []);

  return (
    <div className={styles["main-container"]}>
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
    </div>
  );
};

export default StripeReturnPage;
