/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import type { ReactNode } from 'react';

export const PreferenceSelect = ({
  children,
  classes,
  disabled = false,
  renderValue,
  value,
  withVerticalMargin = true,
  onChange,
}: {
  children: ReactNode;
  classes: {
    select: string;
    selectRoot: string;
    selectRootExtraMargin: string;
  };
  disabled?: boolean;
  renderValue?: () => ReactNode;
  value: unknown;
  withVerticalMargin?: boolean;
  onChange: (event: { target: { value: unknown } }) => void;
}) => (
  <Select
    value={value}
    renderValue={renderValue}
    onChange={onChange}
    variant="filled"
    disableUnderline
    margin="dense"
    classes={{
      select: classes.select,
    }}
    className={`${classes.selectRoot} ${withVerticalMargin ? classes.selectRootExtraMargin : ''}`}
    disabled={disabled}
  >
    {children}
  </Select>
);

export const PreferenceSwitchItem = ({
  checked,
  onChange,
  primary,
  secondary,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  primary: string;
  secondary?: string;
}) => (
  <ListItem>
    <ListItemText primary={primary} secondary={secondary} />
    <ListItemSecondaryAction>
      <Switch
        edge="end"
        color="primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </ListItemSecondaryAction>
  </ListItem>
);
