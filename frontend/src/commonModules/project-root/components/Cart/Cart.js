import { API_RESPONSE_TYPES } from "castofly-common";
import { PRODUCT_NAMES, getProductByName } from "castofly-common/purchases/products.js";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../../commonComponents/Header/Header.js";
import { APP_PAGES, COMMON_MESSAGES } from "../../../../frontEndConstants.js";
import { auth, server } from "../../../../index.js";
import styles from "./Cart.module.scss";
import { FAQs } from "./FAQs.js";
import Products from "./Products.js";

const Cart = () => {
  const navigate = useNavigate();
  const isAnonymous = useSelector(auth.isAnonymousSelector);
  const user = useSelector(auth.userSelector);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedProductName, setSelectedProductName] = useState(PRODUCT_NAMES.TEN);

  const product = getProductByName(selectedProductName);
  const buttonText = `Buy ${product.units} QR Code${product.units > 1 ? "s" : ""}`;

  useEffect(() => {
    const qr_credits = user?.qr_credits;
    if (qr_credits) setMessage(`You have purchased ${qr_credits} lifetime QR code${qr_credits > 1 ? "s" : ""}.`);
  }, [user]);

  const purchase = async () => {
    try {
      if (isAnonymous) {
        navigate("/signup");
        return;
      }

      setIsBusy(true);

      const res = await server.requestFromApiv2(`/stripe/checkout`, {
        method: "POST",
        mode: "cors",
        data: {
          productName: selectedProductName,
          success_url: window.location.origin + "/success",
          cancel_url: window.location.origin + APP_PAGES.CART,
          referral_id: null,
        },
      });

      if (res?.data.message === API_RESPONSE_TYPES.SUCCESS) {
        window.location = res.data.url;
        return null;
      }

      throw new Error("request to stripe failed");
    } catch (error) {
      setIsBusy(false);
      setMessage(COMMON_MESSAGES.GENERIC_ERROR);
    }
  };

  return (
    <div className={styles["main-container"]}>
      <DecoratedButton
        buttonText={"Close"}
        icon={"close"}
        onClick={() => navigate("/")}
        extraContainerClasses={styles["close-container"]}
        theme={BUTTON_THEMES.TRANSPARENT}
      />

      <Header
        title="Lifetime Branded QR Codes"
        info="One-time payment. Permanent QR code. Lifetime tracking."
        extraClasses={styles["header"]}
      />

      <Products selectedProductName={selectedProductName} setSelectedProductName={setSelectedProductName} />

      <DecoratedButton
        buttonText={isBusy ? "Processing..." : buttonText}
        icon="shopping_cart"
        onClick={purchase}
        isBusy={isBusy}
        isRippling={true}
      />
      {message && <span className={styles["message"]}>{message}</span>}
      <FAQs extraClasses={styles["faqs"]} />
    </div>
  );
};

export default Cart;
