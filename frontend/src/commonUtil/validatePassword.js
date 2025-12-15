const validatePassword = (password) => {
  let passwordPolicy = {
    characters: { regEx: "(?=.{8,})", message: "Password minimum length is 8 characters", valid: false },
    hasNumber: { regEx: "(?=.*[0-9])", message: "Contains at least 1 number", valid: false },
    hasSpecialChar: { regEx: "(?=.*[@#$%^&+!=])", message: "Contains at least 1 special character", valid: false },
    hasUppercaseChar: { regEx: "(?=.*[A-Z])", message: "Contains at least 1 uppercase letter", valid: false },
    hasLowercaseChar: { regEx: "(?=.*[a-z])", message: "Contains at least 1 lowercase letter", valid: false },
  };

  Object.keys(passwordPolicy).map((policy) => {
    passwordPolicy[policy].valid = Boolean(password.match(passwordPolicy[policy].regEx));
  });

  return passwordPolicy;
};

export default validatePassword;
