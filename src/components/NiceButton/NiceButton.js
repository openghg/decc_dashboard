import PropTypes from "prop-types";
import React from "react";

import { Button } from "@mui/material";

class NiceButton extends React.Component {
  render() {
    const onClickParam = this.props.onClickParam;

    return (
      <Button
        variant="outlined"
        data-onclickparam={onClickParam}
        onClick={this.props.onClick}
        size="small"
      >
        {this.props.children}
      </Button>
    );
  }
}

NiceButton.propTypes = {
  children: PropTypes.string.isRequired,
  extraStyling: PropTypes.object,
  onClick: PropTypes.func,
  onClickParam: PropTypes.string,
};

export default NiceButton;
