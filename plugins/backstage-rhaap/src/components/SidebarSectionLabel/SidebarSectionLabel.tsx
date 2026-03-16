/*
 * Copyright 2024 The Ansible plugin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { makeStyles, Typography } from '@material-ui/core';
import { useSidebarOpenState } from '@backstage/core-components';

const useStyles = makeStyles(theme => ({
  label: {
    padding: '16px 24px 4px 24px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: theme.palette.text.secondary,
  },
}));

export const SidebarSectionLabel = ({ text }: { text: string }) => {
  const classes = useStyles();
  const { isOpen } = useSidebarOpenState();
  if (!isOpen) return null;
  return <Typography className={classes.label}>{text}</Typography>;
};
