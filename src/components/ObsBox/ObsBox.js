import PropTypes from "prop-types";
import React from "react";
import GraphContainer from "../GraphContainer/GraphContainer";
import MultiSiteLineChart from "../MultiSiteLineChart/MultiSiteLineChart";
import SelectOptions from "../SelectOptions/SelectOptions";
import { getVisID } from "../../util/helpers";
import { Button } from "@mui/material";

import styles from "./ObsBox.module.css";

class ObsBox extends React.Component {
  createEmissionsGraphs() {
    const selectedSources = this.props.selectedSources;

    if (selectedSources.size === 0) {
      return <div className={styles.emptyMessage}>Please select a site</div>;
    }

    if (selectedSources) {
      const key = Object.keys(selectedSources).join("-");

      const widthScale = 0.9;
      const heightScale = 0.9;

      const vis = (
        <GraphContainer heightScale={heightScale} widthScale={widthScale} key={key} divName="graphContent">
          <MultiSiteLineChart
            divID={getVisID()}
            metaStore={this.props.metaStore}
            selectedSources={selectedSources}
            dataStore={this.props.dataStore}
            key={key}
            selectedSpecies={this.props.selectedSpecies}
          />
        </GraphContainer>
      );

      return vis;
    }
  }

  render() {
    const siteSelected = this.props.selectedSources.size > 0;

    let clearButton = null;
    if (siteSelected) {
      clearButton = (
        <Button variant="contained" size="medium" onClick={this.props.clearSources}>
          Clear
        </Button>
      );
    }

    const availableSpecies = Object.keys(this.props.dataStore);

    return (
      <div className={styles.container}>
        <div className={styles.plot}>{this.createEmissionsGraphs()}</div>
        <div className={styles.select}>
          <SelectOptions
            onChange={this.props.speciesSelector}
            options={availableSpecies}
            selected={this.props.selectedSpecies}
          />
          <div className={styles.clearButton}>{clearButton}</div>
        </div>
      </div>
    );
  }
}

ObsBox.propTypes = {
  clearSources: PropTypes.func.isRequired,
  dataStore: PropTypes.object.isRequired,
  selectedSources: PropTypes.object.isRequired,
  selectedSpecies: PropTypes.string.isRequired,
  speciesSelector: PropTypes.func.isRequired,
};

export default ObsBox;
