import PropTypes from "prop-types";
import React from "react";

import styles from "./ObsExplainer.module.css";

class ObsExplainer extends React.Component {
  render() {
    const style = this.props.nogap ? styles.containerNoGap : styles.container;

    return (
      <div className={style}>
        <div className={styles.header} style={{paddingRight: "10px"}}>Atmospheric Monitoring & Verification of the UK’s GHG Inventory</div>
        <div className={styles.explain}>
          <li>
            The UK DECC (Deriving Emissions linked to Climate Change) Network consists of four sites in the UK and
            Ireland measuring greenhouse and ozone depleting gases from tall telecommunication towers.
          </li>
          <li>
            High-frequency measurements of all major greenhouse gases (including carbon dioxide, methane, nitrous oxide,
            sulfur hexafluoride and a suite of halocarbons) are made at these sites.
          </li>
          <li>Start exploring the measurements by selecting a site from the map</li>
        </div>
      </div>
    );
  }
}

ObsExplainer.propTypes = {
  explain: PropTypes.string,
  header: PropTypes.string,
  intro: PropTypes.string,
};

export default ObsExplainer;
