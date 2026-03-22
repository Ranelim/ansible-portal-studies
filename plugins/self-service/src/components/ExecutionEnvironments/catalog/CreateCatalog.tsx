import {
  EmptyStateLayout,
  ExecutionEnvironmentsIllustration,
} from '../../common/EmptyStateLayout';

export const CreateCatalog = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => (
  <div data-testid="catalog-content">
    <EmptyStateLayout
      title="No execution environments yet"
      description="Get started with execution environments to ensure your automation runs consistently everywhere. Choose a recommended preset or start from scratch for full control over your Ansible runtime, Python dependencies, and bundled collections."
      illustration={<ExecutionEnvironmentsIllustration />}
      actionLabel="Create execution environment"
      onAction={() => onTabSwitch(1)}
    />
  </div>
);
