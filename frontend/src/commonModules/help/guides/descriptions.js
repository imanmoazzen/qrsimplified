import { stringToHash } from "castofly-common/hash.js";

export const FOLDER_IN_SHARED_ASSETS = "pets/help";

export const getHelpVoiceURL = (text) =>
  `https://assets.castofly.com/${FOLDER_IN_SHARED_ASSETS}/${stringToHash(text)}.mp3`;

export const AUTOFILL_DESCRIPTIONS = {
  START:
    "Autofill analyzes inputs like transcript, patient images, lab results, and dental chart to automatically fill in the Subjective and Objective sections, and suggest the Assessment and Plan.",
  TRANSCRIPT_TOOL:
    "Use this tool to easily generate or access the session transcript. You can keep using the app and taking notes while it captures everything in the background.",
  TRANSCRIPT_ACTIVE: `You can record an in-person session or talk with your client on the phone in any language. The transcript will always appear in English.\n\nFor this example, click "Add Sample Transcript" to insert sample data into the box.`,
  IMAGES_TOOL:
    "Use this tool to add patient images and annotate them to support your clinical observations. The image can be anything from a regular photo taken with your phone to an X-ray or ultrasound.",
  IMAGES_ACTIVE: `Upload patient images from your device or take new ones using your phone’s camera. Click "Add Sample Image" to insert an example here.`,
  LAB_TOOL: "Use this tool to add lab results that support your clinical observations.",
  LAB_ACTIVE: `You can upload lab results like blood work in PDF format. Scriptover can detect and display trends when multiple readings are available for the same test. Click "Add Sample Result" to attach a lab example.`,
  FINISH:
    "Click the button to see Autofill in action. It analyzes all your inputs — like the transcript, images, lab results, dental chart, and more — to automatically fill in the SOAP sections.",
};

export const CLIENT_PORTAL_DESCRIPTIONS = {
  START:
    "Each client has a personalized care portal with your branding to send questions directly to you. This link is a sample portal—the real client link appears under each patient record.\n\nSubmissions go to their inbox, while AI reviews the patient profile and recent sessions to draft a quick response. You are notified by email, get instant in-app alerts, and all that’s left is to review and approve the AI’s draft response—no missed messages, no extra steps.",
};

export const CLIENT_PORTAL_INSIDE_PROJECT_DESCRIPTIONS = {
  TOOL: "Use this tool to view and reply to client messages. Make sure to share the unique portal link with your client.",
  START:
    "Each client has a personalized care portal with your branding to send questions directly to you. Submissions appear in this inbox, where AI reviews the patient profile and recent sessions to draft a quick response.\n\nYou’ll get email and in-app alerts—just review and approve the AI’s draft, with no missed messages or extra steps.",
  COPY: "Click the button to copy the unique portal link for this client. Then open a new tab, paste it in the address bar, write your message, add images if you’d like, and send it. When you’re done, come back here to view the message.",
  HOW_WORK:
    "AI reviews the latest session, client message, and images to draft a reply. Click the button to see it in action. Don’t worry—the email will only be sent if you explicitly approve it.",
  REVIEW: "You can review and make changes before sending. It will only be sent once you explicitly approve it.",
};

export const COMMUNICATION_DESCRIPTIONS = {
  START: `Clear, consistent messaging keeps everyone aligned, builds trust, improves compliance, and helps prevent misunderstandings or legal issues. AI drafts client communication using the transcript, your clinical assessment, and plan — not the AI-suggested ones.`,
  SAMPLE_DIAGNOSIS: `Click "Add Sample Diagnosis" to insert a sample into your assessment box.`,
  SAMPLE_TREATMENT: "Let’s also add a sample treatment plan for this patient, including some medications.",
  FINISH:
    "Click the button below to see it in action. AI analyzes transcript, your clinical assessment and plan to automatically suggest clear and comprehensive client communication.",
};

export const DIAGNOSIS_DESCRIPTIONS = {
  START:
    "AI analyzes inputs such as transcripts, notes from the subjective and objective sections above, and chronic conditions to suggest a diagnosis.",
  PROFILE_TOOL: "Use this tool to update patient profile and include chronic conditions.",
  FINISH:
    "Now click the button to see it in action. AI analyzes transcripts, notes, and chronic conditions to suggest a diagnosis.",
};

export const ONBOARDING_DESCRIPTIONS = {
  START:
    "First, let’s add a new patient. We’ll use sample data to show how AI instantly transforms your input into a complete report.",
  SAMPLE_PATIENT: "A sample patient was added. Click the button to create the first session.",
  SOAP: "A SOAP note is a structured method veterinarians use to record information during or after a patient visit. SOAP stands for Subjective, Objective, Assessment, and Plan.",
};

export const PLAN_DESCRIPTIONS = {
  START: "AI can review the assessment and other inputs such as the transcript to suggest a treatment plan.",
  SAMPLE_DIAGNOSIS: "Let’s start by adding a sample diagnosis for this patient.",
  FINISH:
    "Click the button to see it in action. AI analyzes the assessment, transcript, and other notes to suggest a treatment plan.",
};

export const PLAN_FROM_DOC_DESCRIPTIONS = {
  START:
    "A plan can also be generated directly from the client invoice. The AI reviews the listed items along with other available data to identify services, medications, and follow-ups.",
};

export const SYNC_DESCRIPTIONS = {
  START:
    "If you tweak content in one section, use this button to automatically sync the Assessment, Plan, and Client Communication for consistency.",
};

export const TRANSCRIPT_DESCRIPTIONS = {
  START:
    "Record the session in any language and get the transcript in English. You can use your phone’s mic to record while the nurse adds notes on another computer, all within the same session with real-time collaboration.",
  PHONE: "Call the client via this phone and talk in any language to automatically receive an English transcript.",
};

export const DENTAL_DESCRIPTIONS = {
  START:
    "Use this tool to easily create dental charts. Add overall findings and treatments, or record them for each individual tooth.",
  NOTES: `AI reviews overall and per-tooth findings, treatments, and the transcript to generate a concise dental note.\n\nClick any tooth on the dental chart to select it. Add some sample data, then click "Suggest Dental Note" to see the result."`,
};

export const ANESTHESIA_DESCRIPTIONS = {
  START: "Use this tool to track vital signs during procedures.",
  START_SURGERY: "Click the button to start a new surgery.",
  ADD_VITAL_SIGNS:
    "Choose a short, clear name for the procedure in the form, and record the initial vital signs to create the first entries.\n\nAbnormal values appear in red, and you can skip any input if needed.",
  ADD_NEW_READING: "You can add a new reading every few minutes and view the time elapsed since the last one below.",
  FINSH_SURGERY: "Finish the surgery by recording the vital signs at the end.",
};

export const ALL_DESCRIPTIONS = [
  ...Object.values(AUTOFILL_DESCRIPTIONS),
  ...Object.values(CLIENT_PORTAL_DESCRIPTIONS),
  ...Object.values(CLIENT_PORTAL_INSIDE_PROJECT_DESCRIPTIONS),
  ...Object.values(COMMUNICATION_DESCRIPTIONS),
  ...Object.values(DIAGNOSIS_DESCRIPTIONS),
  ...Object.values(ONBOARDING_DESCRIPTIONS),
  ...Object.values(PLAN_DESCRIPTIONS),
  ...Object.values(PLAN_FROM_DOC_DESCRIPTIONS),
  ...Object.values(SYNC_DESCRIPTIONS),
  ...Object.values(TRANSCRIPT_DESCRIPTIONS),
  ...Object.values(DENTAL_DESCRIPTIONS),
  ...Object.values(ANESTHESIA_DESCRIPTIONS),
];
