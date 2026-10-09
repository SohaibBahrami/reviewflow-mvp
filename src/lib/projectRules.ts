// Keep the application's TypeScript imports typed while sharing one runtime
// implementation with Node's dependency-free test runner.
export {
  MAX_TRASH_PROJECTS,
  canMoveProjectToTrash,
  countTrashedProjects,
  getDashboardProjectGroups,
  getProjectValidationError,
  startNextVersion,
} from './projectRulesCore.js'
