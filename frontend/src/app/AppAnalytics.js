import { useEffect } from "react";
import { useSelector } from "react-redux";

import { initOpenReplayForApp } from "../openReplay.js";

const AppAnalytics = ({ module, children }) => {
  const user = useSelector(module.userSelector);

  useEffect(() => {
    initOpenReplayForApp(user);
  }, []);

  return children;
};

export default AppAnalytics;
