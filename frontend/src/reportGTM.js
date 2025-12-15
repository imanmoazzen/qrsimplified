import appSettings from "./appSettings.js";

// IMPORTANT: these events and their parameters are tracked by google tag manager
// *** PLEASE DON'T CHANGE THEM ***
const GTM_EVENTS_APP = {
  NEW_SLIDE_CREATED: "new_slide_created",
  NEW_VERSION_PUBLISHED: "new_version_published",
  SHARED_VIA_LINK: "shared_via_link",
  SHARED_VIA_EMAIL: "shared_via_email",
  WATCH_REQUESTED: "watch_requested",
  SLIDE_REVIEW_REQUESTED: "slide_review_requested",
  SLIDE_REVIEWED: "slide_reviewed",
  MAGIC_LINK_COPIED: "magic_link_copied",
  INVITATION_LINK_FOLLOWED: "invitation_link_followed",
  FILE_IMPORTED: "file_imported",
  AUDIO_EDITED: "audio_edited",
  IMAGE_SEARCHED: "image_searched",
  NEW_OBJECT_CREATED: "new_object_created",
  NEW_PANORAMA_PROJECT_CREATED: "new_panorama_project_created",
  NEW_PANORAMA_PROJECT_REQUEST_FROM_DASHBOARD: "new_panorama_project_request_from_dashboard",
  COLLABORATOR_INVITED: "collaborator_invited",
  LOCK_STATUS_CHANGED: "lock_status_changed",
  PROJECT_DUPLICATED: "project_duplicated",
  OBJECT_MOVED: "object_moved",
  FREE_LIMIT_HIT: "free_limit_hit",
  OBJECT_DELETED: "object_deleted",
  OBJECT_RENAMED: "object_renamed",
  COLLABORATORS_BOX_OPENED: "collaborators_box_opened",
  RECORDED: "recorded",
  RETAKEN: "retaken",
  PLAYED: "played",
  PROJECT_SETTINGS_OPENED: "project_settings_opened",
  PROJECT_INSTRUCTIONS_OPENED: "project_instructions_opened",
  TEXT_OBJECT_CREATED: "text_object_created",
};

const GTM_EVENT_PARAMETERS_APP = {
  SLIDE_ID: "slide_id",
  SLIDE_TEMPLATE: "slide_template",
  PROJECT_ID: "project_id",
  FILE_TYPE: "file_type",
  EDIT_ACTION_TYPE: "edit_action_type",
  SEARCH_PHRASE: "search_phrase",
  OBJECT_TYPE: "object_type",
  ROLE_TYPE: "role_type",
  RECORD_DURATION_IN_SECONDS: "record_duration_in_seconds",
};

const GTM_EVENTS_TOOL = {
  TOOL_VISITED: "tool_visited",
  AI_IMAGE_GENERATION_REQUESTED: "ai_image_generation_requested",
  AI_GENERATED_IMAGE_DOWNLOADED: "ai_generated_image_downloaded",
  QUESTION_ASKED_SHEZMU: "question_asked_shezmu",
  SIGNED_UP_SHEZMU: "signed_up_shezmu",
  ENHANCED_AUDIO_DOWNLOADED: "enhanced_audio_downloaded",
  JOINED_CASTOFLY_FROM_AUDIO_ENHANCER: "joined_castofly_from_audio_enhancer",
  UPGRADE_REQUESTED_FROM_AUDIO_ENHANCER: "upgrade_requested_from_audio_enhancer",
};

const GTM_EVENT_PARAMETERS_TOOL = {
  TOOL_NAME: "tool_name",
  IMAGE_INSPIRATION: "image_inspiration",
  QUESTION: "question",
  EMAIL: "email",
};

export const reportNewSlide = (template) => {
  pushEventToDataLayer(GTM_EVENTS_APP.NEW_SLIDE_CREATED, { [GTM_EVENT_PARAMETERS_APP.SLIDE_TEMPLATE]: template });
};

export const reportNewVersion = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.NEW_VERSION_PUBLISHED);
};

export const reportShareViaLink = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.SHARED_VIA_LINK);
};

export const reportShareViaEmail = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.SHARED_VIA_EMAIL);
};

export const reportWatch = (projectId) => {
  pushEventToDataLayer(GTM_EVENTS_APP.WATCH_REQUESTED, { [GTM_EVENT_PARAMETERS_APP.PROJECT_ID]: projectId });
};

export const reportSlideReviewRequested = (projectId) => {
  pushEventToDataLayer(GTM_EVENTS_APP.SLIDE_REVIEW_REQUESTED, { [GTM_EVENT_PARAMETERS_APP.PROJECT_ID]: projectId });
};

export const reportSlideReviewed = (projectId) => {
  pushEventToDataLayer(GTM_EVENTS_APP.SLIDE_REVIEWED, { [GTM_EVENT_PARAMETERS_APP.PROJECT_ID]: projectId });
};

export const reportMagicLinkCopied = (projectId) => {
  pushEventToDataLayer(GTM_EVENTS_APP.MAGIC_LINK_COPIED, { [GTM_EVENT_PARAMETERS_APP.PROJECT_ID]: projectId });
};

export const reportInvitationLinkFollowed = (projectId) => {
  pushEventToDataLayer(GTM_EVENTS_APP.INVITATION_LINK_FOLLOWED, { [GTM_EVENT_PARAMETERS_APP.PROJECT_ID]: projectId });
};

export const reportFileImport = (fileType) => {
  pushEventToDataLayer(GTM_EVENTS_APP.FILE_IMPORTED, { [GTM_EVENT_PARAMETERS_APP.FILE_TYPE]: fileType });
};

export const reportAudioEdit = (actionType) => {
  pushEventToDataLayer(GTM_EVENTS_APP.AUDIO_EDITED, { [GTM_EVENT_PARAMETERS_APP.EDIT_ACTION_TYPE]: actionType });
};

export const reportImageSearchOnline = (phrase) => {
  pushEventToDataLayer(GTM_EVENTS_APP.IMAGE_SEARCHED, { [GTM_EVENT_PARAMETERS_APP.SEARCH_PHRASE]: phrase });
};

export const reportNewObject = (type) => {
  pushEventToDataLayer(GTM_EVENTS_APP.NEW_OBJECT_CREATED, { [GTM_EVENT_PARAMETERS_APP.OBJECT_TYPE]: type });
};

export const reportNewPanoramaProject = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.NEW_PANORAMA_PROJECT_CREATED);
};

export const reportNewPanoramaProjectRequestFromDashboard = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.NEW_PANORAMA_PROJECT_REQUEST_FROM_DASHBOARD);
};

export const reportCollaboratorInvited = (role) => {
  pushEventToDataLayer(GTM_EVENTS_APP.COLLABORATOR_INVITED, { [GTM_EVENT_PARAMETERS_APP.ROLE_TYPE]: role });
};

export const reportLockStatusChanged = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.LOCK_STATUS_CHANGED);
};

export const reportProjectDuplicated = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.PROJECT_DUPLICATED);
};

export const reportObjectMoved = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.OBJECT_MOVED);
};

export const reportToolVisited = (toolName) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.TOOL_VISITED, { [GTM_EVENT_PARAMETERS_TOOL.TOOL_NAME]: toolName });
};

export const reportAIImageGenerationRequested = (inspiration) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.AI_IMAGE_GENERATION_REQUESTED, {
    [GTM_EVENT_PARAMETERS_TOOL.IMAGE_INSPIRATION]: inspiration,
  });
};

export const reportAIImageDownloaded = () => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.AI_GENERATED_IMAGE_DOWNLOADED);
};

export const reportQuestionAskedInShezmu = (question) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.QUESTION_ASKED_SHEZMU, { [GTM_EVENT_PARAMETERS_TOOL.QUESTION]: question });
};

export const reportSignupInShezmu = (email) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.SIGNED_UP_SHEZMU, { [GTM_EVENT_PARAMETERS_TOOL.EMAIL]: email });
};

export const reportFreeLimitHit = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.FREE_LIMIT_HIT);
};

export const reportObjectDeleted = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.OBJECT_DELETED);
};

export const reportObjectRenamed = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.OBJECT_RENAMED);
};

export const reportCollaboratorsBoxOpened = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.COLLABORATORS_BOX_OPENED);
};

export const reportRecord = (durationInSeconds) => {
  pushEventToDataLayer(GTM_EVENTS_APP.RECORDED, {
    [GTM_EVENT_PARAMETERS_APP.RECORD_DURATION_IN_SECONDS]: durationInSeconds,
  });
};

export const reportRetake = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.RETAKEN);
};

export const reportPlay = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.PLAYED);
};

export const reportProjectSettingsOpened = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.PROJECT_SETTINGS_OPENED);
};

export const reportProjectInstructionsOpened = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.PROJECT_INSTRUCTIONS_OPENED);
};

export const reportEnhancedAudioDownloaded = () => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.ENHANCED_AUDIO_DOWNLOADED);
};

export const reportJoinedCastoflyFromAudioEnhancer = (email) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.JOINED_CASTOFLY_FROM_AUDIO_ENHANCER, {
    [GTM_EVENT_PARAMETERS_TOOL.EMAIL]: email,
  });
};

export const reportUpgradeRequestedFromAudioEnhancer = (email) => {
  pushEventToDataLayer(GTM_EVENTS_TOOL.UPGRADE_REQUESTED_FROM_AUDIO_ENHANCER, {
    [GTM_EVENT_PARAMETERS_TOOL.EMAIL]: email,
  });
};

export const reportNewTextObject = () => {
  pushEventToDataLayer(GTM_EVENTS_APP.TEXT_OBJECT_CREATED);
};

const pushEventToDataLayer = (eventName, parameters) => {
  if (!appSettings.isProduction()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...parameters,
  });
};
