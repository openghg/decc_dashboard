import PropTypes from "prop-types";
import React from "react";

import styles from "./NiceButton.module.css";

class NiceButton extends React.Component {
  render() {
    const style = styles.niceButton;
    const extrastyling = this.props.extrastyling ? this.props.extrastyling : {};
    const onClickParam = this.props.onClickParam;

    return (
      <button
        type="button"
        data-onclickparam={onClickParam}
        className={style}
        style={extrastyling}
        onClick={this.props.onClick}
      >
        {this.props.children}
      </button>
    );
  }
}

NiceButton.propTypes = {
  children: PropTypes.string.isRequired,
  extrastyling: PropTypes.object,
  onClick: PropTypes.func,
  onClickParam: PropTypes.string,
};

export default NiceButton;
