/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Menu from '@mui/material/Menu';
import PropTypes from 'prop-types';
import React from 'react';

type StatedMenuProps = {
  buttonElement: React.ReactElement;
  children: React.ReactNode;
  id: string;
};

type StatedMenuState = {
  anchorEl?: HTMLElement;
  open: boolean;
};

class StatedMenu extends React.Component<StatedMenuProps, StatedMenuState> {
  static propTypes = {
    buttonElement: PropTypes.element.isRequired,
    children: PropTypes.node.isRequired,
    id: PropTypes.string.isRequired,
  };

  constructor(props: StatedMenuProps) {
    super(props);

    this.state = {
      anchorEl: undefined,
      open: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
  }

  handleClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    this.setState({ open: true, anchorEl: event.currentTarget });
  }

  handleRequestClose() {
    this.setState({ open: false });
  }

  render() {
    const { buttonElement, children, id } = this.props;

    const { anchorEl, open } = this.state;

    return (
      <>
        {React.cloneElement(buttonElement, {
          'aria-owns': id,
          'aria-haspopup': true,
          onClick: this.handleClick,
        })}
        <Menu
          id={id}
          anchorEl={anchorEl}
          open={open}
          onClose={this.handleRequestClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {React.Children.map(
            children,
            (child) =>
              React.isValidElement<{ onClick?: (event: React.MouseEvent<HTMLElement>) => void }>(
                child,
              ) &&
              React.cloneElement(child, {
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  child.props.onClick?.(e);
                  this.handleRequestClose();
                },
              }),
          )}
        </Menu>
      </>
    );
  }
}

export default StatedMenu;
