import AUTOFILL from "../images/autofill.png";
import COMMUNICATION from "../images/client-communication.png";
import CLIENT_PORTAL from "../images/client-portal.png";
import DENTAL_CHARTING from "../images/dental-charting.png";
import DIAGNOSIS from "../images/diagnosis.png";
import NAVLE from "../images/navle.png";
import START from "../images/start.png";
import PLAN from "../images/treatment-plan.png";
import VITAL_SIGN from "../images/vital-sign.png";
import { HELP_IDS } from "../store/uiReducer.js";

export const GUIDES = [
  {
    id: "navle",
    imgSource: NAVLE,
    title: "Scriptover Passed NAVLE",
    description:
      "To test Scriptover’s clinical judgment, we ran it through a full NAVLE-style exam. The AI veterinary assistant scored an impressive 83% on the North American Veterinary Licensing Examination.",
    buttonText: "Read More",
    buttonIcon: "article",
    helpId: null,
    hasDemoProjectDependency: false,
    onClick: () => window.open("https://vets.scriptover.com/blog/scriptover_passed_navle", "_blank"),
  },
  {
    id: "start",
    imgSource: START,
    title: "Quick Start",
    description:
      "Learn the core of Scriptover in under a minute by creating a sample patient record, adding sample data, and seeing how AI transforms it into a complete report.",
    helpId: HELP_IDS.ONBOARDING,
    video: "https://assets.castofly.com/demo/scriptover.mp4",
    poster: "https://assets.castofly.com/pets/poster.png",
    isOnDashboard: true,
    hasDemoProjectDependency: false,
  },
  {
    id: "autofill",
    imgSource: AUTOFILL,
    title: "SOAP Note Autofill",
    description:
      "AI analyzes the session transcript, images, lab results and dental chart to automatically fill in the Subjective and Objective sections and suggest clear, accurate Assessments and Plans.",
    helpId: HELP_IDS.AUTOFILL,
    hasDemoProjectDependency: true,
  },
  {
    id: "dental",
    imgSource: DENTAL_CHARTING,
    title: "Dental Charting",
    description:
      "Dental charting is time-consuming, but Scriptover makes it simple by capturing findings, procedures, and assessments, then organizing them into a clear summary.",
    helpId: HELP_IDS.DENTAL,
    hasDemoProjectDependency: true,
  },
  {
    id: "diagnosis",
    imgSource: DIAGNOSIS,
    title: "Diagnosis",
    description:
      "AI analyzes inputs like transcripts, notes from the subjective and objective sections, and chronic conditions to suggest an accurate diagnosis.",
    helpId: HELP_IDS.DIAGNOSIS,
    hasDemoProjectDependency: true,
  },
  {
    id: "plan",
    imgSource: PLAN,
    title: "Treatment Plan",
    description: "AI reviews the assessment and other inputs such as the transcript to suggest a treatment plan.",
    helpId: HELP_IDS.PLAN,
    hasDemoProjectDependency: true,
  },
  {
    id: "communication",
    imgSource: COMMUNICATION,
    title: "Client Communication",
    description:
      "AI drafts clear client communication that keeps everyone aligned, builds trust, improves compliance, and helps prevent misunderstandings or legal issues",
    helpId: HELP_IDS.COMMUNICATION,
    hasDemoProjectDependency: true,
  },
  {
    id: "client",
    imgSource: CLIENT_PORTAL,
    title: "Client Care Portal",
    description:
      "Each client gets a branded care portal to message you directly. Submissions appear in thir inbox, where AI reviews the patient profile and recent sessions to draft a quick response.",
    helpId: HELP_IDS.INBOX,
    hasDemoProjectDependency: true,
    isSigninRequired: true,
  },
  {
    id: "anesthesia",
    imgSource: VITAL_SIGN,
    title: "Anesthetic Monitoring",
    description:
      "Easily track and record vital signs throughout the procedure, with automatic alerts for abnormal values and clear visual indicators for trends.",
    helpId: HELP_IDS.ANESTHESIA,
    hasDemoProjectDependency: true,
  },
];
