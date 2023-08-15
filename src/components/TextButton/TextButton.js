import PropTypes from "prop-types";
import React from "react";
import { Button } from "@mui/material";
import styles from "./TextButton.module.css";

class TextButton extends React.Component {
  render() {
    let style = styles.light;
    const styling = this.props.styling;
    if (styling === "dark") {
      style = styles.dark;
    } else if (styling === "selected") {
      style = styles.selected;
    } else if (styling === "speciesSelected") {
      style = styles.speciesSelected;
    }

    // Shoehorn another way of doing this in
    if (this.props.selected) {
      style = styles.dark;
    }

    const extraStyling = this.props.extraStyling ? this.props.extraStyling : {};

    return (
      <Button
        variant = "outlined"
        type="button"
        data-onclickparam={this.props.onClickParam}
        className={style}
        style={extraStyling}
        onClick={this.props.onClick}
      >
        {this.props.children}
      </Button>
    );
  }
}

TextButton.propTypes = {
  children: PropTypes.string.isRequired,
  extraStyling: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  onClickParam: PropTypes.string,
  selected: PropTypes.bool,
  styling: PropTypes.string,
};

export default TextButton;
