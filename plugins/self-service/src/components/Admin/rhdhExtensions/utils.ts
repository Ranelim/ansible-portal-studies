/*
 * Vendored from redhat-developer/rhdh-plugins
 * workspaces/extensions/plugins/extensions/src/utils.ts (getCategoryTagDisplayInfo)
 */

export type CategoryTagDisplayOptions = {
  maxLength?: number;
};

export const getCategoryTagDisplayInfo = (
  categoryName: string,
  options: CategoryTagDisplayOptions = {},
) => {
  const { maxLength = 25 } = options;

  const shouldTruncate = categoryName.length > maxLength;
  const displayName = shouldTruncate
    ? `${categoryName.substring(0, maxLength)}...`
    : categoryName;

  return {
    displayName,
    tooltipTitle: shouldTruncate ? categoryName : '',
    shouldShowTooltip: shouldTruncate,
  };
};
