import { ACTIVE_COUPON_NAME, getCoupon } from "castofly-common/purchases/coupons.js";
import { getFeatures } from "castofly-common/purchases/products.js";

import CountdownTimer from "../../../../commonComponents/Countdown/CountdownTimer.js";
import Feature from "./Feature.js";
import styles from "./ProductCard.module.scss";

const ProductCard = ({ product, isSelected, onClick }) => {
  const { name, displayName, amount } = product;

  const couponId = ACTIVE_COUPON_NAME;
  const features = getFeatures(name);

  const coupon = getCoupon(couponId, name);
  const discount = coupon?.discountAmount ?? 0;
  const discountedPrice = Math.round(amount - discount);
  const totalSave = Math.round(discount);

  return (
    <div onClick={onClick} className={`${styles["main-container"]}  ${isSelected && styles["selected"]}`}>
      {coupon && (
        <div className={styles["coupon-container"]}>
          <section>
            <span className="material-symbols-outlined">{coupon.icon}</span>
            {coupon.message}
          </section>

          <CountdownTimer targetDate={coupon.endDate} />
        </div>
      )}

      <div className={styles["card-container"]}>
        <div className={styles["name-container"]}>
          <span>{displayName}</span>
          <div className={`${styles["price"]} ${coupon ? styles["off"] : ""}`}>
            <span>{`$${amount}`}</span>
          </div>
          <div className={`${styles["price-discounted"]} ${!coupon ? styles["hidden"] : ""}`}>
            <span>{`$${discountedPrice} USD`}</span>
          </div>
        </div>

        <div className={styles["details"]}>
          {features.map((feature, index) => (
            <Feature icon={feature.icon} title={feature.text} key={index} />
          ))}
        </div>
      </div>
      <span className={styles["saving"]}>Save ${totalSave}</span>
    </div>
  );
};

export default ProductCard;
