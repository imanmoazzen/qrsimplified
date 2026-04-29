import { APP_PAGES } from "castofly-common/appPages.js";
import { getProductByName } from "castofly-common/purchases/products.js";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import WaitIndicator from "../../../commonComponents/WaitIndicator/WaitIndicator.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { server } from "../../../index.js";
import styles from "./PastOrdersPage.module.scss";

const PastOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setIsBusy(true);

    server
      .requestFromApiv2(`/stripe/orders`, {
        method: "GET",
        mode: "cors",
      })
      .then((results) => setOrders(results?.data?.orders ?? []))
      .catch(() => setMessage(COMMON_MESSAGES.GENERIC_ERROR))
      .finally(() => setIsBusy(false));
  }, []);

  useEffect(() => {
    setMessage(orders?.length === 0 ? "You haven’t placed any orders yet!" : "");
  }, [orders]);

  if (isBusy) return <WaitIndicator text="Loading..." />;

  return (
    <div className={styles["main-container"]}>
      <DecoratedButton
        buttonText={"Close"}
        icon={"close"}
        onClick={() => navigate("/")}
        extraContainerClasses={styles["close-container"]}
        theme={BUTTON_THEMES.TRANSPARENT}
      />

      <Header title="Your Orders" info="View your past orders and receipts" />

      {orders.length === 0 && (
        <DecoratedButton
          icon="shopping_cart"
          buttonText={"Buy QR Codes"}
          theme={BUTTON_THEMES.COLORED}
          onClick={() => navigate(APP_PAGES.CART)}
          extraClasses={styles["purchase-button"]}
        />
      )}

      {orders.length > 0 && (
        <table className={styles["orders-table"]}>
          <thead>
            <tr>
              <th>Order Date</th>
              <th>Amount</th>
              <th>Quantity</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.purchase_id}>
                <td>{new Date(order.created * 1000).toISOString().split("T")[0]}</td>
                <td>${(order.amount_total / 100).toFixed(2)}</td>
                <td>{getProductByName(order.product_name).units}</td>
                <td>
                  {order.receipt_url ? (
                    <a href={order.receipt_url} target="_blank" rel="noreferrer" className={styles["link"]}>
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles["contact-us"]}>
        <span className="material-symbols-outlined">mail</span>
        <span>Contact us at info@qrsimplified.com for questions about orders or payments.</span>
      </div>
      {message && <span className={styles["message"]}>{message}</span>}
    </div>
  );
};

export default PastOrdersPage;
