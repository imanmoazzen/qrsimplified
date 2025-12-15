import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { clearAllMessages } from "../store/uiReducer.js";
import Message from "./Message.js";
import styles from "./MessageContainer.module.scss";

const MessageContainer = ({ module }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const messages = useSelector(module.getMessages);
  const [initialPath, setInitialPath] = useState("");

  useEffect(() => {
    setInitialPath(location.pathname);
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;

    const initialPathPart = initialPath.split("/")[1];
    const currentPathPart = currentPath.split("/")[1];

    if (initialPathPart !== currentPathPart) {
      dispatch(clearAllMessages());
      setInitialPath(location.pathname);
    }
  }, [location.pathname]);

  if (!messages || messages?.length === 0) return;

  return (
    <div className={styles["message-container"]}>
      {messages.map((msg) => (
        <Message message={msg} key={msg.id} />
      ))}
    </div>
  );
};

export default MessageContainer;
