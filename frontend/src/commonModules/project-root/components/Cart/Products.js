import { PRODUCTS } from "castofly-common/purchases/products.js";

import ProductCard from "./ProductCard.js";
import styles from "./Products.module.scss";

const Products = ({ selectedProductName, setSelectedProductName }) => {
  return (
    <div className={styles["main-container"]}>
      {PRODUCTS.map((product, index) => {
        const isSelected = product.name === selectedProductName;

        return (
          <ProductCard
            key={index}
            product={product}
            isSelected={isSelected}
            onClick={() => setSelectedProductName(product.name)}
          />
        );
      })}
    </div>
  );
};

export default Products;
