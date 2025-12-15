import { useEffect, useState } from "react";

import validatePassword from "../commonUtil/validatePassword.js";

const usePasswordPolicyValidator = (password) => {
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [policyStatus, setPolicyStatus] = useState(false);

  useEffect(() => {
    const validationStatus = validatePassword(password);
    setIsPasswordValid(Object.values(validationStatus).every((item) => item.valid === true));
    setPolicyStatus(validationStatus);
  }, [password]);

  return { isPasswordValid, policyStatus };
};

export default usePasswordPolicyValidator;
