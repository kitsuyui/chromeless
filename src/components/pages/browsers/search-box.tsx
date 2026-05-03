/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import connectComponent from '../../../helpers/connect-component';

import { updateQuery } from '../../../state/installed/actions';

const styles = (theme) => ({
  toolbarSearchContainer: {
    zIndex: 10,
    position: 'relative',
    borderRadius: 6,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    backgroundColor:
      theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.dark,
    color: alpha(theme.palette.common.white, 0.88),
    flex: 1,
    WebkitAppRegion: 'no-drag',
  },
  toolbarSectionSearch: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    height: 28,
    margin: '0 auto',
  },
  searchBarText: {
    padding: '0 4px',
    flex: 1,
    userSelect: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    transform: 'translateY(-1px)',
    fontWeight: 'normal',
  },
  input: {
    font: 'inherit',
    border: 0,
    display: 'block',
    verticalAlign: 'middle',
    whiteSpace: 'normal',
    background: 'none',
    margin: 0,
    color: 'inherit',
    width: '100%',
    padding: 16,
    '&:focus': {
      outline: 0,
    },
    '&::placeholder': {
      color: alpha(theme.palette.common.white, 0.3),
    },
  },
  searchIcon: {
    fill: theme.palette.common.white,
  },
  searchButton: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
});

type SearchBoxProps = {
  classes: Record<
    | 'input'
    | 'searchBarText'
    | 'searchButton'
    | 'searchIcon'
    | 'toolbarSearchContainer'
    | 'toolbarSectionSearch',
    string
  >;
  onUpdateQuery: (query: string) => void;
  query: string;
};

class SearchBox extends React.Component<SearchBoxProps> {
  static defaultProps = {
    query: '',
  };

  static propTypes = {
    classes: PropTypes.object.isRequired,
    onUpdateQuery: PropTypes.func.isRequired,
    query: PropTypes.string,
  };

  inputBox: HTMLInputElement | null;

  constructor(props) {
    super(props);
    this.inputBox = null;

    this.handleFocusSearch = this.handleFocusSearch.bind(this);
  }

  componentDidMount() {
    window.ipcRenderer.on('focus-search', this.handleFocusSearch);

    this.inputBox?.focus();
  }

  componentWillUnmount() {
    window.ipcRenderer.removeListener('focus-search', this.handleFocusSearch);
  }

  handleFocusSearch() {
    this.inputBox?.focus();
    this.inputBox?.select();
  }

  render() {
    const { classes, onUpdateQuery, query } = this.props;

    const clearSearchAction = (
      <>
        {query.length > 0 && (
          <Tooltip title="Clear search" placement="left">
            <IconButton
              color="inherit"
              size="small"
              aria-label="Clear"
              onClick={() => onUpdateQuery('')}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
    return (
      <Paper elevation={1} className={classes.toolbarSearchContainer}>
        <div className={classes.toolbarSectionSearch}>
          <SearchIcon className={classes.searchIcon} fontSize="small" />
          <Typography className={classes.searchBarText} color="inherit" variant="subtitle1">
            <input
              className={classes.input}
              onChange={(e) => onUpdateQuery(e.currentTarget.value)}
              onInput={(e) => onUpdateQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                  onUpdateQuery('');
                }
              }}
              placeholder="Search installed apps..."
              ref={(inputBox) => {
                this.inputBox = inputBox;
              }}
              value={query}
            />
          </Typography>
          {clearSearchAction}
        </div>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  query: state.installed.query,
});

const actionCreators = {
  updateQuery,
};

export default connectComponent(SearchBox, mapStateToProps, actionCreators, styles);
