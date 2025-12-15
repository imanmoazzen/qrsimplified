import { useEffect, useRef, useState } from "react";

import { countWords } from "../../commonUtil/countWords.js";
import styles from "./DynamicTextArea.module.scss";

const DynamicTextArea = ({
  label,
  text,
  setText = () => {},
  onTempTextChanged = () => {},
  maximumNumberOfCharacters,
  minimumNumberOfRows = 4,
  isBusy,
  isReadOnly,
  extraClasses,
  placeholder = "Type text or #keyword to search tags and insert their content",
  changeActiveStatus,
}) => {
  const textareaRef = useRef();
  const spanRef = useRef();
  const [tempTextState, setTempTextState] = useState("");
  const [numberOfWords, setNumberOfWords] = useState(countWords(tempTextState));
  const [wordsPerRow, setWordsPerRow] = useState(1);
  const [numberOfLineBreaks, setNumberOfLineBreaks] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const baseRows = Math.max(Math.ceil(numberOfWords / wordsPerRow), 1);
  const numberOfRows = Math.max(baseRows + numberOfLineBreaks, minimumNumberOfRows);
  const isMaxReached = maximumNumberOfCharacters ? tempTextState.length === maximumNumberOfCharacters : false;

  const tempTextStateChanged = (text) => {
    const trimmedText = trimText(text);
    setNumberOfWords(countWords(trimmedText));
    setTempTextState(trimmedText);
    onTempTextChanged(trimmedText);
    setNumberOfLineBreaks((trimmedText.match(/\r?\n/g) || []).length);
  };

  const trimText = (text) => {
    if (!maximumNumberOfCharacters) return text;
    return text.length <= maximumNumberOfCharacters ? text : text.substring(0, maximumNumberOfCharacters);
  };

  useEffect(() => {
    const updateWordsPerRow = () => {
      if (!spanRef.current || !textareaRef.current) return;
      const helloWidth = spanRef.current.offsetWidth;
      const textareaWidth = textareaRef.current.offsetWidth;
      if (helloWidth > 0) setWordsPerRow(Math.max(Math.ceil((0.65 * textareaWidth) / helloWidth), 1));
    };

    updateWordsPerRow();
    window.addEventListener("resize", updateWordsPerRow);
    return () => window.removeEventListener("resize", updateWordsPerRow);
  }, []);

  useEffect(() => {
    tempTextStateChanged(text ?? "");
  }, [text]);

  const handleFocus = () => {
    changeActiveStatus?.(true);
    setIsFocused(true);
  };

  const handleBlur = (event) => {
    changeActiveStatus?.(false);
    setIsFocused(false);
    setText(event.target.value);
  };

  return (
    <div className={`${styles["main-container"]} ${extraClasses} ${isFocused ? styles["focused"] : ""} dynamic-text`}>
      <span ref={spanRef} style={{ visibility: "hidden", position: "absolute", whiteSpace: "nowrap" }}>
        hello
      </span>
      {label && <label className={styles["text-area-label"]}>{label}</label>}
      <textarea
        ref={textareaRef}
        rows={numberOfRows}
        value={tempTextState}
        onChange={(event) => tempTextStateChanged(event.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        onFocus={handleFocus}
        disabled={isReadOnly || isBusy}
      ></textarea>
      {maximumNumberOfCharacters && isFocused && (
        <span className={styles["character-limit"]} data-is-max-reached={isMaxReached}>
          {isMaxReached && <span className={styles["max-character-message"]}>Maximum character reached: </span>}
          {`${tempTextState.length}/${maximumNumberOfCharacters}`}
        </span>
      )}
    </div>
  );
};

export default DynamicTextArea;
