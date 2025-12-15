import { useEffect, useState } from "react";

import styles from "./HighLevelSummary.module.scss";
import { REFERRAL_PERCENTAGE } from "./Referral.js";
import { convertToAccountingFormat } from "./utils.js";

const HighLevelSummary = ({ views, paymentsInfo = [] }) => {
  const [signups, setSignups] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    let numberOfSignups = 0;
    let numberOfActivePayingUsers = 0;
    let totalRevenue = 0;

    paymentsInfo.forEach((payment) => {
      if (payment.signupDate) numberOfSignups++;
      if (payment.isActive) numberOfActivePayingUsers += payment.quantity;
      if (payment.revenue) totalRevenue += payment.revenue;
    });

    setSignups(numberOfSignups);
    setPayingUsers(numberOfActivePayingUsers);
    setRevenue((totalRevenue * REFERRAL_PERCENTAGE) / 100);
  }, [paymentsInfo]);

  return (
    <div className={styles["main-container"]}>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th>Link Views</th>
            <th>Signups</th>
            <th>Paying Users</th>
            <th>Your Total Earnings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{views}</td>
            <td>{signups}</td>
            <td>{payingUsers}</td>
            <td>{convertToAccountingFormat(revenue)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default HighLevelSummary;
