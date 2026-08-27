import { QualityPostureOverview } from './QualityPostureOverview';

/** Quality overview body — same as Git Repositories Quality. */
export const QualityDashboardTabContent = ({
  onStartScan,
  onAddRepository,
}: {
  onStartScan?: () => void;
  onAddRepository?: () => void;
}) => (
  <QualityPostureOverview
    onStartScan={onStartScan}
    onAddRepository={onAddRepository}
  />
);
