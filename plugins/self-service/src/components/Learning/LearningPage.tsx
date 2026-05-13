import { useState } from 'react';
import {
  Page,
  Header,
  Content,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Collapse,
  Button,
  Link,
  Chip,
  LinearProgress,
  Grid,
  makeStyles,
} from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SchoolIcon from '@material-ui/icons/School';
import TimerIcon from '@material-ui/icons/Timer';
import BuildIcon from '@material-ui/icons/Build';
import SecurityIcon from '@material-ui/icons/Security';
import CloudIcon from '@material-ui/icons/Cloud';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 900,
  },
  courseGrid: {
    marginBottom: theme.spacing(3),
  },
  courseCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    },
  },
  courseCardDisabled: {
    opacity: 0.65,
  },
  breadcrumbs: {
    marginBottom: theme.spacing(2),
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontSize: 14,
      cursor: 'pointer',
      '&:hover': { textDecoration: 'underline' },
    },
    '& .MuiBreadcrumbs-separator': { margin: '0 4px' },
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: theme.palette.text.primary,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(1.5),
  },
  courseTitle: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: theme.spacing(0.5),
  },
  courseDesc: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    flex: 1,
  },
  courseMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  progressCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(3),
  },
  progressContent: {
    padding: theme.spacing(3),
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.action.hover,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
  },
  progressBarFill: {
    borderRadius: 4,
  },
  stepCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  },
  stepCardActive: {
    borderColor: theme.palette.primary.main,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2, 2.5),
    cursor: 'pointer',
    gap: theme.spacing(1.5),
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  stepNumberPending: {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary,
  },
  stepNumberDone: {
    backgroundColor: `${statusColors.success}20`,
    color: statusColors.success,
  },
  stepTitle: {
    flex: 1,
    fontWeight: 600,
    fontSize: 15,
  },
  stepDuration: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    flexShrink: 0,
  },
  expandedContent: {
    padding: theme.spacing(0, 2.5, 2.5, 7),
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 1.7,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  actionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  actionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 0),
    fontSize: 14,
  },
  actionCheckbox: {
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  actionTextDone: {
    textDecoration: 'line-through',
    color: theme.palette.text.disabled,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
}));

// ---------------------------------------------------------------------------
// Course data
// ---------------------------------------------------------------------------
type ChecklistAction = {
  id: string;
  label: string;
  link?: { text: string; url: string };
};

type ChecklistStep = {
  id: string;
  title: string;
  duration: string;
  description: string;
  actions: ChecklistAction[];
  category: 'get-started' | 'create' | 'govern' | 'operate';
};

const GETTING_STARTED_CHECKLIST: ChecklistStep[] = [
  {
    id: 'explore-portal',
    title: 'Explore the Ansible Portal',
    duration: '5 min',
    category: 'get-started',
    description:
      'Get familiar with the portal layout. The sidebar gives you quick access to Projects, Templates, Shared Assets (Collections, EEs), and Administration.',
    actions: [
      { id: 'nav-repos', label: 'Browse Git Repositories to see discovered repos with Ansible content', link: { text: 'Open Git Repositories', url: '/self-service/repositories' } },
      { id: 'nav-collections', label: 'Explore synced Collections from Private Automation Hub', link: { text: 'Open Collections', url: '/self-service/collections' } },
      { id: 'nav-ees', label: 'Review available Execution Environments', link: { text: 'Open EEs', url: '/self-service/ee' } },
    ],
  },
  {
    id: 'understand-projects',
    title: 'Understand the Project model',
    duration: '3 min',
    category: 'get-started',
    description:
      'A Project is the core entity in the portal. It represents a governed automation initiative backed by a Git repository, with CI/CD pipelines, policy checks, and AAP integration. Projects can be created from templates (recommended) or from discovered repositories.',
    actions: [
      { id: 'read-about', label: 'Open a project and review its Overview, Pipeline, and Resources tabs' },
      { id: 'understand-maturity', label: 'Understand the maturity tracker — from creation to production deployment' },
      { id: 'review-pipeline', label: 'Review how pipeline stages (Lint, Policy, EE Compatibility) validate your content' },
    ],
  },
  {
    id: 'create-first-project',
    title: 'Create your first project',
    duration: '10 min',
    category: 'create',
    description:
      'Use a template to scaffold a new automation project. The wizard guides you through naming, connecting a Git repo, selecting a pipeline type, and configuring the AAP destination.',
    actions: [
      { id: 'pick-template', label: 'Go to Templates and choose a template that matches your use case', link: { text: 'Open Templates', url: '/self-service/repositories/create' } },
      { id: 'fill-details', label: 'Fill in project details — try the AI Jumpstart to auto-generate settings' },
      { id: 'connect-git', label: 'Connect to an existing repo or let the portal create a new one' },
      { id: 'select-pipeline', label: 'Choose Standard (fast) or Comprehensive (full governance) pipeline' },
      { id: 'configure-aap', label: 'Set the AAP Controller and organization for deployment' },
      { id: 'review-create', label: 'Review and create — watch the pipeline run on your first commit' },
    ],
  },
  {
    id: 'import-existing-repo',
    title: 'Import an existing repository',
    duration: '5 min',
    category: 'create',
    description:
      'If you already have Git repos with Ansible content, the portal discovers them automatically. You can create a project from any discovered repository to bring it under governance.',
    actions: [
      { id: 'check-repos', label: 'Go to Git Repositories and find your discovered repos', link: { text: 'Open Git Repositories', url: '/self-service/repositories' } },
      { id: 'click-create', label: 'Click "Create project" on a repo that doesn\'t have one yet' },
      { id: 'review-content', label: 'Review the discovered content (playbooks, roles, EE definitions)' },
    ],
  },
  {
    id: 'run-pipeline',
    title: 'Understand and fix pipeline results',
    duration: '10 min',
    category: 'govern',
    description:
      'Every commit triggers a pipeline that validates your automation content. Learn to read the results, fix lint warnings, resolve policy violations, and verify EE compatibility.',
    actions: [
      { id: 'view-pipeline', label: 'Open a project and go to the Pipeline tab' },
      { id: 'expand-stages', label: 'Click on each pipeline run to see individual stage results' },
      { id: 'read-logs', label: 'Expand a failed stage and click "View log" to see details' },
      { id: 'fix-push', label: 'Fix any issues in your code, push, and watch the pipeline re-run' },
    ],
  },
  {
    id: 'push-to-aap',
    title: 'Push your project to AAP',
    duration: '5 min',
    category: 'operate',
    description:
      'Once all pipeline stages pass, push your project to Ansible Automation Platform. This creates or updates the AAP Project and Job Template, making your automation ready to run in production.',
    actions: [
      { id: 'check-maturity', label: 'Verify all maturity steps are complete on the Overview tab' },
      { id: 'push', label: 'Go to AAP Activity tab and click "Push to AAP"' },
      { id: 'verify-push', label: 'Confirm the AAP Project and Job Template show "Pushed" status' },
      { id: 'run-job', label: 'Launch a job from AAP and monitor it in the AAP Activity tab' },
    ],
  },
  {
    id: 'explore-shared-assets',
    title: 'Work with Collections and Execution Environments',
    duration: '5 min',
    category: 'operate',
    description:
      'Collections provide reusable modules and roles. Execution Environments provide the container images that run your automation. Learn how they connect to your projects.',
    actions: [
      { id: 'browse-collections', label: 'Browse Collections synced from your Private Automation Hub', link: { text: 'Open Collections', url: '/self-service/collections' } },
      { id: 'check-ee', label: 'Review an EE to see its included collections and Python packages', link: { text: 'Open EEs', url: '/self-service/ee' } },
      { id: 'understand-deps', label: 'Check your project\'s requirements.yml in the YAML tab to see collection dependencies' },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  'get-started': 'Get started',
  create: 'Create',
  govern: 'Govern',
  operate: 'Operate',
};

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: number;
  icon: React.ReactNode;
  iconBg: string;
  available: boolean;
  docLink?: { text: string; url: string };
};

const COURSES: Course[] = [
  {
    id: 'getting-started',
    title: 'Getting started with the Ansible Portal',
    description: 'Learn the portal layout, create your first project, understand pipelines, and push to AAP. The essential walkthrough for new users.',
    duration: '~45 min',
    steps: 7,
    icon: <SchoolIcon style={{ fontSize: 24, color: '#fff' }} />,
    iconBg: statusColors.info,
    available: true,
  },
  {
    id: 'custom-ee',
    title: 'Building custom Execution Environments',
    description: 'Learn to define, build, and publish custom EEs with specific collections and Python dependencies for your automation needs.',
    duration: '~30 min',
    steps: 5,
    icon: <BuildIcon style={{ fontSize: 24, color: '#fff' }} />,
    iconBg: '#7b1fa2',
    available: false,
    docLink: { text: 'Execution Environment documentation', url: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.5/html/creating_and_consuming_execution_environments' },
  },
  {
    id: 'policy-governance',
    title: 'Policy and governance best practices',
    description: 'Set up organizational policies, enforce naming conventions, restrict module usage, and ensure compliance across all automation projects.',
    duration: '~25 min',
    steps: 4,
    icon: <SecurityIcon style={{ fontSize: 24, color: '#fff' }} />,
    iconBg: '#e65100',
    available: false,
    docLink: { text: 'Ansible Automation Platform documentation', url: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform' },
  },
  {
    id: 'aap-workflows',
    title: 'Advanced AAP workflows',
    description: 'Go beyond single job templates. Learn workflows, surveys, approval gates, and scheduling automation at scale.',
    duration: '~40 min',
    steps: 6,
    icon: <CloudIcon style={{ fontSize: 24, color: '#fff' }} />,
    iconBg: '#2e7d32',
    available: false,
    docLink: { text: 'AAP workflow documentation', url: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.5/html/using_automation_execution/controller-workflows' },
  },
];

const STORAGE_KEY = 'ansible-portal-learning-progress';

const loadProgress = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProgress = (progress: Record<string, boolean>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

// ---------------------------------------------------------------------------
// Course catalog view
// ---------------------------------------------------------------------------
const CourseCatalog = ({
  onSelect,
  progress,
}: {
  onSelect: (courseId: string) => void;
  progress: Record<string, boolean>;
}) => {
  const classes = useStyles();

  const gsTotalActions = GETTING_STARTED_CHECKLIST.reduce((sum, s) => sum + s.actions.length, 0);
  const gsCompleted = GETTING_STARTED_CHECKLIST.reduce(
    (sum, s) => sum + s.actions.filter(a => progress[a.id]).length, 0,
  );

  return (
    <Box className={classes.root}>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24 }}>
        Guided learning paths to help you get the most out of the Ansible Portal.
        Start with the essentials, then explore advanced topics.
      </Typography>
      <Grid container spacing={3} className={classes.courseGrid}>
        {COURSES.map(course => (
          <Grid item xs={12} sm={6} key={course.id}>
            <Card
              className={`${classes.courseCard} ${!course.available ? classes.courseCardDisabled : ''}`}
              variant="outlined"
              onClick={() => onSelect(course.id)}
            >
              <CardContent style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box
                  className={classes.courseIcon}
                  style={{ backgroundColor: course.iconBg }}
                >
                  {course.icon}
                </Box>
                <Typography className={classes.courseTitle}>
                  {course.title}
                </Typography>
                <Typography className={classes.courseDesc}>
                  {course.description}
                </Typography>
                <Box className={classes.courseMeta}>
                  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                    <TimerIcon style={{ fontSize: 14, color: '#888' }} />
                    <Typography variant="caption" color="textSecondary">
                      {course.duration}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {course.steps} steps
                  </Typography>
                  {course.id === 'getting-started' && gsCompleted > 0 && (
                    <Chip
                      size="small"
                      label={gsCompleted === gsTotalActions ? 'Completed' : `${gsCompleted}/${gsTotalActions}`}
                      style={{
                        fontSize: 11,
                        height: 20,
                        marginLeft: 'auto',
                        backgroundColor: gsCompleted === gsTotalActions ? `${statusColors.success}20` : undefined,
                        color: gsCompleted === gsTotalActions ? statusColors.success : undefined,
                      }}
                    />
                  )}
                  {!course.available && (
                    <Chip
                      size="small"
                      label="Coming soon"
                      variant="outlined"
                      style={{ fontSize: 11, height: 20, marginLeft: 'auto' }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography className={classes.sectionLabel}>
        Additional resources
      </Typography>
      <Card className={classes.stepCard} variant="outlined">
        <CardContent style={{ padding: '16px 20px' }}>
          <Box display="flex" flexDirection="column" style={{ gap: 8 }}>
            <Link
              href="https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
            >
              <OpenInNewIcon style={{ fontSize: 14 }} />
              Ansible Automation Platform documentation
            </Link>
            <Link
              href="https://www.redhat.com/en/technologies/management/ansible/automation-content-navigator"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
            >
              <OpenInNewIcon style={{ fontSize: 14 }} />
              Ansible Content Navigator
            </Link>
            <Link
              href="https://ansible.readthedocs.io/en/latest/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
            >
              <OpenInNewIcon style={{ fontSize: 14 }} />
              Ansible community documentation
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Getting started course detail
// ---------------------------------------------------------------------------
const GettingStartedCourse = ({
  onBack,
  progress,
  onToggle,
}: {
  onBack: () => void;
  progress: Record<string, boolean>;
  onToggle: (actionId: string) => void;
}) => {
  const classes = useStyles();
  const [expandedStep, setExpandedStep] = useState<string | null>(
    GETTING_STARTED_CHECKLIST[0].id,
  );

  const totalActions = GETTING_STARTED_CHECKLIST.reduce(
    (sum, step) => sum + step.actions.length, 0,
  );
  const completedActions = GETTING_STARTED_CHECKLIST.reduce(
    (sum, step) => sum + step.actions.filter(a => progress[a.id]).length, 0,
  );
  const progressPercent = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const isStepComplete = (step: ChecklistStep) =>
    step.actions.every(a => progress[a.id]);

  let lastCategory = '';

  return (
    <Box className={classes.root}>
      <Breadcrumbs
        separator={<NavigateNextIcon style={{ fontSize: 16 }} />}
        className={classes.breadcrumbs}
      >
        <Link component="button" onClick={onBack} style={{ border: 'none', background: 'none', padding: 0 }}>
          Learning
        </Link>
        <Typography className={classes.breadcrumbCurrent}>
          Getting started with the Ansible Portal
        </Typography>
      </Breadcrumbs>

      <Card className={classes.progressCard} variant="outlined">
        <CardContent className={classes.progressContent}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" style={{ gap: 12 }}>
              <SchoolIcon style={{ color: statusColors.info, fontSize: 28 }} />
              <Box>
                <Typography style={{ fontWeight: 600, fontSize: 16 }}>
                  Getting started with the Ansible Portal
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {completedActions} of {totalActions} tasks completed
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label={`${Math.round(progressPercent)}%`}
              style={{
                fontWeight: 600,
                fontSize: 13,
                backgroundColor: progressPercent === 100 ? `${statusColors.success}20` : undefined,
                color: progressPercent === 100 ? statusColors.success : undefined,
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            className={classes.progressBar}
            classes={{ bar: classes.progressBarFill }}
          />
        </CardContent>
      </Card>

      {GETTING_STARTED_CHECKLIST.map((step, stepIndex) => {
        const showCategory = step.category !== lastCategory;
        lastCategory = step.category;
        const isExpanded = expandedStep === step.id;
        const stepDone = isStepComplete(step);

        return (
          <Box key={step.id}>
            {showCategory && (
              <Typography className={classes.sectionLabel}>
                {CATEGORY_LABELS[step.category]}
              </Typography>
            )}
            <Card
              className={`${classes.stepCard} ${isExpanded ? classes.stepCardActive : ''}`}
              variant="outlined"
            >
              <Box
                className={classes.stepHeader}
                onClick={() =>
                  setExpandedStep(prev => prev === step.id ? null : step.id)
                }
              >
                {stepDone ? (
                  <CheckCircleIcon style={{ color: statusColors.success, fontSize: 28 }} />
                ) : (
                  <Box className={`${classes.stepNumber} ${classes.stepNumberPending}`}>
                    {stepIndex + 1}
                  </Box>
                )}
                <Typography
                  className={classes.stepTitle}
                  style={stepDone ? { color: statusColors.success } : undefined}
                >
                  {step.title}
                </Typography>
                <Typography className={classes.stepDuration}>
                  ~{step.duration}
                </Typography>
                {isExpanded ? (
                  <ExpandLessIcon style={{ color: '#999', fontSize: 20 }} />
                ) : (
                  <ExpandMoreIcon style={{ color: '#999', fontSize: 20 }} />
                )}
              </Box>
              <Collapse in={isExpanded}>
                <Box className={classes.expandedContent}>
                  <Typography className={classes.stepDescription}>
                    {step.description}
                  </Typography>
                  <ul className={classes.actionList}>
                    {step.actions.map(action => {
                      const done = !!progress[action.id];
                      return (
                        <li key={action.id} className={classes.actionItem}>
                          <Box
                            className={classes.actionCheckbox}
                            onClick={() => onToggle(action.id)}
                          >
                            {done ? (
                              <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />
                            ) : (
                              <RadioButtonUncheckedIcon style={{ fontSize: 18, color: '#bbb' }} />
                            )}
                          </Box>
                          <Box>
                            <Typography
                              className={`${classes.actionText} ${done ? classes.actionTextDone : ''}`}
                            >
                              {action.label}
                            </Typography>
                            {action.link && !done && (
                              <Link
                                href={action.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 12,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  marginTop: 2,
                                }}
                              >
                                <PlayArrowIcon style={{ fontSize: 12 }} />
                                {action.link.text}
                                <OpenInNewIcon style={{ fontSize: 10, marginLeft: 2 }} />
                              </Link>
                            )}
                          </Box>
                        </li>
                      );
                    })}
                  </ul>
                </Box>
              </Collapse>
            </Card>
          </Box>
        );
      })}

      <Box style={{ height: 48 }} />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Coming soon stub
// ---------------------------------------------------------------------------
const ComingSoonStub = ({
  course,
  onBack,
}: {
  course: Course;
  onBack: () => void;
}) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Breadcrumbs
        separator={<NavigateNextIcon style={{ fontSize: 16 }} />}
        className={classes.breadcrumbs}
      >
        <Link component="button" onClick={onBack} style={{ border: 'none', background: 'none', padding: 0 }}>
          Learning
        </Link>
        <Typography className={classes.breadcrumbCurrent}>
          {course.title}
        </Typography>
      </Breadcrumbs>

      <Card className={classes.progressCard} variant="outlined">
        <CardContent className={classes.progressContent}>
          <Box display="flex" alignItems="center" style={{ gap: 16 }}>
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: course.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {course.icon}
            </Box>
            <Box style={{ flex: 1 }}>
              <Typography style={{ fontWeight: 600, fontSize: 16 }}>
                {course.title}
              </Typography>
              <Chip
                size="small"
                label="Coming soon"
                variant="outlined"
                style={{ fontSize: 11, height: 20, marginTop: 4 }}
              />
            </Box>
          </Box>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: 16, lineHeight: 1.7 }}
          >
            {course.description} This learning path is currently under development
            and will be available in a future update.
          </Typography>
          {course.docLink && (
            <Box style={{ marginTop: 16 }}>
              <Link
                href={course.docLink.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                }}
              >
                <OpenInNewIcon style={{ fontSize: 14 }} />
                {course.docLink.text}
              </Link>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const LearningPage = () => {
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);

  const toggleAction = (actionId: string) => {
    setProgress(prev => {
      const next = { ...prev, [actionId]: !prev[actionId] };
      saveProgress(next);
      return next;
    });
  };

  const selectedCourse = activeCourse
    ? COURSES.find(c => c.id === activeCourse)
    : null;

  const renderContent = () => {
    if (activeCourse === 'getting-started') {
      return (
        <GettingStartedCourse
          onBack={() => setActiveCourse(null)}
          progress={progress}
          onToggle={toggleAction}
        />
      );
    }
    if (selectedCourse && !selectedCourse.available) {
      return (
        <ComingSoonStub
          course={selectedCourse}
          onBack={() => setActiveCourse(null)}
        />
      );
    }
    return (
      <CourseCatalog
        onSelect={setActiveCourse}
        progress={progress}
      />
    );
  };

  return (
    <Page themeId="app">
      <Header
        title="Learning"
        subtitle="Guided learning paths for the Ansible Portal"
      />
      <Content>
        {renderContent()}
      </Content>
    </Page>
  );
};
