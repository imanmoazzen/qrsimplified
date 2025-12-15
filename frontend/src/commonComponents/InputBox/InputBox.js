import { useEffect, useState } from "react";

import { useClassNames } from "../../hooks/useClassNames.js";
import styles from "./InputBox.module.scss";

const InputBox = ({
  name,
  autoComplete = "off",
  label,
  value,
  setValue,
  type = "text",
  onFocus,
  onBlur,
  onKeyDown,
  extraClasses,
  placeholder,
  isReadOnly,
  isDisabled,
  isHorizontal,
  isCloseButtonAvailable,
  isRippling,
  datalist,
}) => {
  const [internalType, setInternalType] = useState(type);
  const [isVisibilityButtonAvailable, setIsVisibilityButtonAvailable] = useState(false);
  const [isValueVisible, setIsValueVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isCheckbox = type === "checkbox";

  const mainClassNames = useClassNames(
    styles,
    "main-container",
    isHorizontal && "horizontal",
    isFocused && "focused",
    isCheckbox && "checkbox",
    extraClasses
  );

  useEffect(() => {
    if (type === "password") setIsVisibilityButtonAvailable(true);
  }, [type]);

  const checkForEnter = (event) => {
    event.stopPropagation();
    if (event.code === "Enter") {
      event.preventDefault();
      event.target.blur();
    }
  };

  return (
    <div className={mainClassNames}>
      {label && <label className={styles["label"]}>{label}</label>}
      <div className={styles["input-container"]}>
        {!isCheckbox && (
          <>
            <input
              name={name}
              disabled={isDisabled || isReadOnly}
              placeholder={placeholder}
              autoComplete={autoComplete}
              readOnly={isReadOnly}
              type={internalType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => {
                setIsFocused(false);
                onBlur?.();
              }}
              onKeyUp={checkForEnter}
              onKeyDown={onKeyDown}
              list={datalist?.id}
            />

            {datalist && (
              <datalist id={datalist.id}>
                {datalist.values.map((value, index) => (
                  <option value={value} key={index} />
                ))}
              </datalist>
            )}

            {isCloseButtonAvailable && (
              <button
                icon="close"
                onClick={() => setValue("")}
                className={`material-symbols-outlined ${styles["button"]}`}
              >
                close
              </button>
            )}
          </>
        )}
        {isCheckbox && (
          <input
            disabled={isDisabled}
            readOnly={isReadOnly}
            type="checkbox"
            checked={value}
            onChange={(e) => setValue(e.target.checked)}
            className={styles["checkbox"]}
          />
        )}
        {isVisibilityButtonAvailable && (
          <button
            onClick={() => {
              setIsValueVisible(!isValueVisible);
              setInternalType(isValueVisible ? "password" : "text");
            }}
            className={`material-symbols-outlined ${styles["button"]}`}
            tabIndex="-1"
          >
            {isValueVisible ? "visibility_off" : "visibility"}
          </button>
        )}
        {isRippling && <span className={styles["ripple"]}></span>}
      </div>
    </div>
  );
};

export default InputBox;
