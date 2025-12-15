import { useEffect, useState } from "react";

import styles from "./PaymentDetails.module.scss";
import { REFERRAL_PERCENTAGE } from "./Referral.js";
import { convertToAccountingFormat } from "./utils.js";

const PaymentDetails = ({ paymentsInfo = [] }) => {
  const [sortedPaymentsInfo, setSortedPaymentInfo] = useState(paymentsInfo);

  useEffect(() => {
    if (!paymentsInfo || paymentsInfo.length === 0) return;
    const sortedData = [...paymentsInfo].sort((a, b) => new Date(a.signupDate) - new Date(b.signupDate));
    setSortedPaymentInfo(sortedData);
  }, [paymentsInfo]);

  if (sortedPaymentsInfo.length === 0) return null;

  return (
    <div className={styles["main-container"]}>
      <h3>Users Referred by You</h3>
      <div className={styles["details-container"]}>
        <div className={styles["title-container"]}>
          <span>Email</span>
          <span className={styles["hideable"]}>Signup Date</span>
          <span className={styles["hideable"]}>Subscription Start Date</span>
          <span className={styles["hideable"]}>Subscription End Date</span>
          <span>Number of Licenses</span>
          <span>Subscription Status</span>
          <span>Your Earnings</span>
        </div>
        {sortedPaymentsInfo.map((payment, index) => (
          <PaymentCard payment={payment} key={index} />
        ))}
      </div>
    </div>
  );
};

export default PaymentDetails;

const PaymentCard = ({ payment }) => {
  const { email, signupDate, subscriptionStartDate, subscriptionEndDate, isActive, quantity = 0, revenue } = payment;

  return (
    <div className={styles["payment-card-container"]}>
      <span>{email}</span>
      <span className={styles["hideable"]}>{signupDate}</span>
      <span className={styles["hideable"]}>{subscriptionStartDate || "N/A"}</span>
      <span className={styles["hideable"]}>{subscriptionEndDate || "N/A"}</span>
      <span>{quantity}</span>
      <span>{isActive ? "Active" : "Not Active"}</span>
      <span>{convertToAccountingFormat(((revenue || 0) * REFERRAL_PERCENTAGE) / 100)}</span>
    </div>
  );
};
