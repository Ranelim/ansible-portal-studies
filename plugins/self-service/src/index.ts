export * from './plugin';

export { SignInPage } from './components/SignInPage';
export { LandingPage } from './components/LandingPage';
export { TaskList } from './components/TaskList';
export {
  EEBuilderSidebarItem,
  CollectionsSidebarItem,
  GitRepositoriesSidebarItem,
} from './components/SidebarItems';
export { AAPTokenFieldExtension } from './components/Scaffolder/AAPTokenField/extensions';
export { AAPResourcePickerExtension } from './components/Scaffolder/AAResourcePicker';
export { BaseImagePickerFieldExtension } from './components/Scaffolder/BaseImagePicker/extensions';
export { CollectionsPickerFieldExtension } from './components/Scaffolder/CollectionsPicker/extensions';
export { FileUploadPickerFieldExtension } from './components/Scaffolder/FileUploadPicker/extensions';
export { PackagesPickerFieldExtension } from './components/Scaffolder/PackagesPicker/extensions';
export { MCPServersPickerFieldExtension } from './components/Scaffolder/MCPServersPicker/extensions';
export { AdditionalBuildStepsPickerFieldExtension } from './components/Scaffolder/AdditionalBuildStepsPicker/extensions';
export { EEFileNamePickerFieldExtension } from './components/Scaffolder/EEFileNamePicker/extensions';
export { EETagsPickerFieldExtension } from './components/Scaffolder/EETagsPicker/extensions';
export { ScmSelectorFieldExtension } from './components/Scaffolder/ScmSelector/extensions';

export * from './apis';

export { RestartProvider, useRestartRequired } from './components/Admin/RestartContext';

export { useUserRole, useUserRoleContext, UserRoleContext } from './hooks/useUserRole';
export {
  useNavPlugins,
  writeNavPlugins,
  type NavPluginId,
  type NavPluginsState,
} from './hooks/useNavPlugins';
export {
  useNavIaModel,
  writeNavIaModel,
  writeNavExperience,
  availableExperiences,
  EXPERIENCE_LABELS,
  isDevelopExperience,
  isDevelopReposRailMode,
  experienceFromPath,
  type NavIaModel,
  type NavExperience,
} from './hooks/useNavIaModel';
export {
  useBridgeExperienceVisibility,
  readBridgeExperienceVisibility,
  writeBridgeExperienceVisibility,
  type BridgeExperienceId,
} from './hooks/bridgeExperienceVisibility';
export {
  EXPERIENCE_LANDING,
  pushRecentExperience,
  readRecentExperiences,
  sortExperiencesByRecent,
  JOB_EXPERIENCE_IDS,
  type ExperienceId,
  type JobExperienceId,
} from './hooks/experienceRecent';
export {
  ExperienceThumbnail,
  EXPERIENCE_ACCENT,
} from './components/IaPlaceholder/experienceVisuals';
export {
  NAV_IA_REVIEW_MODS,
  isSmeRole,
} from './components/IaPlaceholder/navIaReviewMods';
export {
  SHOW_ASSISTANT_EXPERIENCE,
  ASSISTANT_SIDE_NAV_TRIAL,
  isAssistantPath,
  assistantUsesSideNav,
} from './components/IaPlaceholder/assistantIaTrial';
export { useAssistantChatTrial } from './components/IaPlaceholder/assistantChatTrialStore';
export type { UserRole, UseUserRoleResult } from './hooks/useUserRole';
export { SHOW_ADMIN_PLUGINS } from './components/Admin/adminPluginsTrial';
export { useAdminSyncIa } from './components/Admin/useAdminSyncIa';
export type { AdminSyncIaVariant } from './components/Admin/adminSyncIa';
export {
  useExperienceSetup,
  isExperienceSetup,
} from './hooks/experienceSetup';
export { useDevSpacesSetup } from './hooks/devSpacesSetup';
export {
  useAttentionSeen,
  useAttentionClearOnActive,
  isAttentionSeen,
  markAttentionSeen,
  type AttentionKey,
} from './hooks/attentionSeen';
export { AttentionDot } from './components/common/AttentionDot';
export {
  FORCED_ADMIN_SYNC_IA,
  readAdminSyncIa,
  writeAdminSyncIa,
} from './components/Admin/adminSyncIa';
export { useIntegrationsOrientIa } from './components/Admin/useIntegrationsOrientIa';
export type { IntegrationsOrientVariant } from './components/Admin/integrationsOrientIa';
export {
  FORCED_INTEGRATIONS_ORIENT,
  readIntegrationsOrient,
  writeIntegrationsOrient,
} from './components/Admin/integrationsOrientIa';
export { useTemplatesRunsIa } from './hooks/useTemplatesRunsIa';
export type { TemplatesRunsIaVariant } from './hooks/templatesRunsIa';
export {
  FORCED_TEMPLATES_RUNS_IA,
  readTemplatesRunsIa,
  writeTemplatesRunsIa,
  isAutomateExperienceEnabled,
} from './hooks/templatesRunsIa';

