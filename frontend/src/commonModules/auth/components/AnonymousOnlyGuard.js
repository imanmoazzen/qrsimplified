import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { APP_PAGES } from "../../../frontEndConstants.js";

const AnonymousOnlyGuard = ({ module, redirectTo = APP_PAGES.DASHBOARD, children }) => {
  const navigate = useNavigate();
  const isAnonymous = useSelector(module.isAnonymousSelector);

  useEffect(() => {
    if (!isAnonymous) {
      navigate(redirectTo);
    }
  }, [isAnonymous]);

  if (isAnonymous) {
    return children;
  }
  return null;
};

export default AnonymousOnlyGuard;
