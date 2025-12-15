export const FEEDBACK_TYPE = {
  POSITIVE: "POSITIVE",
  NEGATIVE: "NEGATIVE",
  SUGGESTION: "SUGGESTION",
  TECHNICAL_ISSUE: "TECHNICAL_ISSUE",
};

export const FEEDBACK_DETAILS = {
  [FEEDBACK_TYPE.POSITIVE]: { label: "I like something", title: "What do you like?", icon: "thumb_up" },
  [FEEDBACK_TYPE.NEGATIVE]: { label: "I don't like something", title: "What do you not like?", icon: "thumb_down" },
  [FEEDBACK_TYPE.SUGGESTION]: {
    label: "I have a feature suggestion",
    title: "What suggestion do you have?",
    icon: "lightbulb",
  },
  [FEEDBACK_TYPE.TECHNICAL_ISSUE]: {
    label: "I have a technical issue",
    title: "What is your technical issue?",
    icon: "bug_report",
  },
};

export const SUCCESS_MESSAGES = {
  [FEEDBACK_TYPE.POSITIVE]: {
    title: "Thank You",
    message: "We love your feedback and always happy to hear about your experience.",
  },
  [FEEDBACK_TYPE.NEGATIVE]: {
    title: "Thank You",
    message: "Your feedback is highly valued and is used to improve Scriptover.",
  },
  [FEEDBACK_TYPE.SUGGESTION]: {
    title: "Thank You",
    message: "We love your ideas and we will foward this over to our product team!",
  },
  [FEEDBACK_TYPE.TECHNICAL_ISSUE]: {
    title: "Thank You",
    message: "We are working hard to resolve this issue and will contact you shortly.",
  },
};
