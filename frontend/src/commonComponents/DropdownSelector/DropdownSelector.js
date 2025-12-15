import styles from "./DropdownSelector.module.scss";

const DropdownSelector = ({
  value,
  setValue,
  options,
  optionLabels,
  extraClasses = "",
  isDisabled,
  isRippling,
  setIsFocused,
}) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      <select
        className={styles["dropdown"]}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={isDisabled}
        onFocus={() => setIsFocused?.(true)}
        onBlur={() => setIsFocused?.(false)}
      >
        {options.map((value, index) => (
          <option value={value} key={index}>
            {optionLabels[index]}
          </option>
        ))}
      </select>
      {isRippling && <span className={styles["ripple"]}></span>}
    </div>
  );
};

export default DropdownSelector;
