import PropTypes from "prop-types";
import React from "react";
import ExplanationBox from "../ExplanationBox/ExplanationBox";
import LeafletMap from "../LeafletMap/LeafletMap";

import styles from "../../Dashboard.module.css";
import ObsBox from "../ObsBox/ObsBox";
import ObsExplainer from "../ObsExplainer/ObsExplainer";

class LiveData extends React.Component {
  createMapExplainer() {
    const header = "Atmospheric Monitoring & Verification of the UK’s GHG Inventory";
    const explainer = `The UK DECC (Deriving Emissions linked to Climate Change) Network consists of four sites in the UK and Ireland measuring 
    greenhouse and ozone depleting gases from tall telecommunication towers.`;
    return <ExplanationBox header={header} explain={explainer} split={true} />;
  }

  createIntro() {}

  render() {
    const mapCentre = [54.5168, -2.5645]; // lat / long

    return (
      <div className={styles.content}>
        <div className={styles.intro}>{this.createIntro()}</div>
        <div className={styles.timeseries} id="graphContent">
          <ObsBox
            clearSources={this.props.clearSources}
            speciesSelector={this.props.speciesSelector}
            selectedSources={this.props.selectedSources}
            processedData={this.props.processedData}
            selectedSpecies={this.props.selectedSpecies}
            defaultSpecies={this.props.defaultSpecies}
          />
        </div>
        <div className={styles.mapExplainer}>
          <ObsExplainer />
        </div>
        <div className={styles.siteMap}>
          <LeafletMap
            sourceSelector={this.props.sourceSelector}
            selectedSpecies={this.props.selectedSpecies}
            centre={mapCentre}
            zoom={5}
            processedData={this.props.processedData}
            siteInfoOverlay={this.props.setSiteOverlay}
            siteStructure={this.props.siteStructure}
          />
        </div>
      </div>
    );
  }
}

LiveData.propTypes = {
  clearSources: PropTypes.func.isRequired,
  defaultSpecies: PropTypes.string.isRequired,
  processedData: PropTypes.object.isRequired,
  selectedSources: PropTypes.object.isRequired,
  selectedSpecies: PropTypes.string.isRequired,
  setSiteOverlay: PropTypes.func.isRequired,
  siteStructure: PropTypes.object.isRequired,
  sourceSelector: PropTypes.func.isRequired,
  speciesSelector: PropTypes.func.isRequired,
};

export default LiveData;
