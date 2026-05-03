/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// External Dependencies

import { withStyles } from '@mui/styles';
import type { Styles } from '@mui/styles/withStyles';
import type { ComponentType } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

type ActionCreators = Record<string, (...args: unknown[]) => unknown>;
type StyleDefinition = Styles<unknown, Record<string, unknown>>;

const connectComponent = <Props extends object>(
  component: ComponentType<Props>,
  mapStateToProps?: unknown,
  actionCreators?: ActionCreators | null,
  styles?: unknown,
): ComponentType<Partial<Props>> => {
  // Adds `on` to binded action names
  const onActionCreators: ActionCreators = {};
  if (actionCreators) {
    Object.keys(actionCreators).forEach((key) => {
      const newKey = `on${key[0].toUpperCase()}${key.substring(1, key.length)}`;
      onActionCreators[newKey] = actionCreators[key];
    });
  }

  const styledComponent = styles
    ? withStyles(styles as StyleDefinition, { name: component.name })(
        component as ComponentType<never>,
      )
    : component;

  return connect(mapStateToProps as never, (dispatch) =>
    bindActionCreators(onActionCreators, dispatch),
  )(styledComponent as ComponentType<never>) as ComponentType<Partial<Props>>;
};

export default connectComponent;
