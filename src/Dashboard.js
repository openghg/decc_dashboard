import React from "react";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import { cloneDeep, has, set, get } from "lodash";

import ControlPanel from "./components/ControlPanel/ControlPanel";
import OverlayContainer from "./components/OverlayContainer/OverlayContainer";

import TextButton from "./components/TextButton/TextButton";
import Overlay from "./components/Overlay/Overlay";
import FAQ from "./components/FAQ/FAQ";
import LiveData from "./components/LiveData/LiveData";

import { importSiteImages } from "./util/helpers";
import styles from "./Dashboard.module.css";

// Site description information
import siteInfoJSON from "./data/siteInfo.json";
import completeMetadata from "./deccoutput/metadata_complete.json";
import { Button } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";

async function retrieveJSON(url) {
  return await (await fetch(url)).json();
}

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      showSidebar: false,
      selectedKeys: {},
      emptySelection: true,
      overlayOpen: false,
      overlay: null,
      layoutMode: "dashboard",
      colours: {},
      dataStore: {},
    };

    this.dataRepoURL = "https://raw.githubusercontent.com/openghg/decc_dashaboard_data/main";

    this.sourceSelector = this.sourceSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSources = this.clearSources.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    // this.setSiteOverlay = this.setSiteOverlay.bind(this);
  }

  // These handle the initial setup of the app

  /**
   * Read the config file to setup the default site, species etc
   */
  setupDefaults() {
    // this.state...
  }

  /**
   * Adds data to the data store, converting it to the structure required by Plotly
   *
   * @param {string} species - Species
   * @param {string} sourceKey - Source key
   * @param {string} data - Data that's been passed through the to_plotly function
   *
   */
  addDataToStore(sourceKey, data) {
    const x_timestamps = Object.keys(data);
    const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
    const y_values = Object.values(data);

    const forPlotly = {
      x_values: x_values,
      y_values: y_values,
    };

    // TODO - can we do this better so we don't end up copying all the data each time?
    // Will this work?
    this.setState((prevState) => {
      let previous = { ...prevState.dataSource.sourceKey };
      previous = forPlotly;
      return { previous };
    });
  }

  /**
   * Retrieves data from the given URL and processes it into a format
   * plotly can read
   *
   * @param {string} filename - Name of file to be retrieved from remote data store
   * @param {string} species - Species
   * @param {string} sourceKey - Source key
   *
   */
  retrieveData(filename, sourceKey) {
    const currentVal = get(this.state.dataStore, sourceKey);
    if (currentVal !== null) {
      console.log(`We already have data for ${sourceKey}`);
      return;
    }

    const url = new URL(filename, this.dataRepoURL).href;

    retrieveJSON(url).then((result) => {
      this.addDataToStore(sourceKey, result);
    });
  }

  /**
   * Create the data structure used to create the plots Plotly can read
   * We create the dataStore object which has the following structure
   *
   *  dataStore = {
   *   "species": {
   *     "network_site_inlet_instrument": {"x_values": [1,2,3], "y_values": [1,2,3]}
   *   }
   * }
   *
   */
  populateAndRetrieve(metadata) {
    // Loop over the metadata dictionary
    // Create the
    // This should aleady be in the right shape, we use the nested aspect of
    // the dictionary to make it easy to populate the interface, creating
    // some lookup tables for filenames etc below
    this.state.completeMetadata = metadata;
    let defaultSpecies = null;
    let defaultSite = null;
    let defaultInlet = null;
    // Not sure if we need default instrument but
    let defaultInstrument = null;
    let defaultNetwork = null;
    let defaultSourceKey = null;
    // We just need to pull out the initial data
    // We retrieve only the first dataset and then populate the other data values with nulls
    // When this data is selected the app will retrieve the data

    let dataStore = {};
    let filenameLookup = {};

    try {
      for (const [species, networkData] of Object.entries(completeMetadata)) {
        if (defaultSpecies === null) defaultSpecies = species;
        for (const [network, siteData] of Object.entries(networkData)) {
          if (defaultNetwork === null) defaultNetwork = network;
          for (const [site, inletData] of Object.entries(siteData)) {
            if (defaultSite === null) defaultSite = site;
            for (const [inlet, instrumentData] of Object.entries(inletData)) {
              if (defaultInlet === null) defaultInlet = inlet;
              for (const [instrument, fileMetadata] of Object.entries(instrumentData)) {
                // The complete source key should always have the species
                const completeSourceKey = `${species}.${network}_${site}_${inlet}_${instrument}`;

                if (defaultSourceKey === null) defaultSourceKey = completeSourceKey;
                let measurementData = null;
                const filename = fileMetadata["filename"];

                if (!defaultInstrument) {
                  defaultInstrument = instrument;

                  const url = new URL(filename, this.dataRepoURL);
                  retrieveJSON(url).then((result) => {
                    this.addDataToStore(species, completeSourceKey, result);
                  });
                }

                set(dataStore, completeSourceKey, measurementData);
                set(filenameLookup, completeSourceKey, filename);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing raw data - ${error}`);
    }

    // Should we use setState here? Does that work properly now?
    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    // Give each site a colour
    this.state.dataStore = dataStore;
    this.state.defaultSpecies = defaultSpecies;
    this.state.selectedSources = new Set([defaultSourceKey]);
    this.state.selectedSpecies = defaultSpecies;
    this.state.isLoaded = true;
    /* eslint-enable react/no-direct-mutation-state */
  }

  componentDidMount() {
    // Retrieve the metadata
    // const metadataURL = new URL("fileMetadata.json", this.dataRepoURL).href

    const metadataURL =
      "https://gist.githubusercontent.com/gareth-j/328fa8a1b5d61ed3a543710b10de4ddc/raw/6f616b8046b6bc266b82c3bdfc0ceaa198f0bbb5/metadata_complete.json";

    retrieveJSON(metadataURL).then(
      (result) => {
        this.populateAndRetrieve(result);
        this.setState({
          isLoaded: true,
        });
      },
      (error) => {
        this.setState({
          isLoaded: true,
          error,
        });
      }
    );
  }

  /**
   * @deprecated Deprecated in the DECC Dashboard
   */
  buildSiteInfo() {
    console.warn("This function may be removed as it unused in this version of the dashboard.");
    const siteImages = importSiteImages();

    let siteData = {};
    for (const site of Object.keys(siteInfoJSON)) {
      try {
        siteData[site] = {};
        siteData[site]["image"] = siteImages[site];
        siteData[site]["description"] = siteInfoJSON[site]["description"];
      } catch (error) {
        console.error(error);
      }
    }

    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    this.state.siteInfo = siteData;
    /* eslint-enable react/no-direct-mutation-state */
  }

  // These handle app control by the components

  /**
   * Selects a data source - a specific species at a site at an inlet
   *
   * @param {string} selection - Key for a data source
   */
  sourceSelector(selection) {
    let selectedSourcesSet = new Set();

    if (selection instanceof Set) {
      selectedSourcesSet = selection;
    } else {
      selectedSourcesSet.add(selection);
    }

    // Here we change all the sites and select all species / sectors at that site
    let selectedSources = cloneDeep(this.state.selectedSources);

    for (const source of selectedSourcesSet) {
      if (selectedSources.has(source)) {
        selectedSources.delete(source);
      } else {
        selectedSources.add(source);
      }
    }

    // Now let's make sure we have all the data for these new selections
    // the source will be the key in the
    for (const source of selectedSources) {
      const key = `${this.state.selectedSpecies}.${source}`;
      const filename = this.state.filenameLookup[key];
      this.retrieveData();
    }

    this.setState({ selectedSources: selectedSources });
  }

  /**
   * Clear the currently selected data sources
   */
  clearSources() {
    this.setState({ selectedSources: new Set() });
  }

  /**
   * Selects a species
   *
   * @param {string} species - Species name
   */
  speciesSelector(species) {
    const speciesLower = species.toLowerCase();

    const selectedSourcesClone = cloneDeep(this.state.selectedSources);

    this.setState({ selectedSources: new Set() }, () => {
      this.sourceSpeciesChange(species, selectedSourcesClone);
    });

    this.setState({ selectedSpecies: speciesLower });
  }

  /**
   * Selects a species
   *
   * @param {string} species - Species name
   * @param {Set<string>} oldSelectedSources - Set of previously selected sources
   */
  sourceSpeciesChange(species, oldSelectedSources) {
    const speciesData = this.state.dataStore[species];

    let newSources = new Set();

    for (const sourceKey of oldSelectedSources) {
      if (has(speciesData, sourceKey)) {
        newSources.add(sourceKey);
      }
    }

    if (newSources.size === 0) {
      const defaultSource = Object.keys(speciesData)[0];
      newSources.add(defaultSource);
    }

    this.sourceSelector(newSources);
  }

  toggleOverlay() {
    this.setState({ overlayOpen: !this.state.overlayOpen });
  }

  setOverlay(overlay) {
    this.setState({ overlayOpen: true, overlay: overlay });
  }

  toggleSidebar() {
    this.setState({ showSidebar: !this.state.showSidebar });
  }

  setSiteOverlay(e) {
    const siteCode = String(e.target.dataset.onclickparam).toUpperCase();
    const siteInfo = this.state.siteInfo[siteCode];

    const siteText = siteInfo["description"];
    const image = siteInfo["image"];
    const alt = `Image of ${siteCode}`;

    const overlay = (
      <Overlay header={siteCode} text={siteText} alt={alt} image={image} toggleOverlay={this.toggleOverlay} />
    );

    this.toggleOverlay();
    this.setOverlay(overlay);
  }

  render() {
    let { error, isLoaded } = this.state;

    let overlay = null;
    if (this.state.overlayOpen) {
      overlay = <OverlayContainer toggleOverlay={this.toggleOverlay}>{this.state.overlay}</OverlayContainer>;
    }

    let extraSidebarStyle = {};
    if (this.state.showSidebar) {
      extraSidebarStyle = { transform: "translateX(0px)" };
    }

    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return (
        <div className={styles.loaderContent}>
          <div className={styles.loaderRing}></div>
        </div>
      );
    } else {
      const liveData = (
        <LiveData
          clearSources={this.clearSources}
          speciesSelector={this.speciesSelector}
          sourceSelector={this.sourceSelector}
          dataStore={this.state.dataStore}
          selectedSources={this.state.selectedSources}
          selectedKeys={this.state.selectedKeys}
          selectedSpecies={this.state.selectedSpecies}
          defaultSpecies={this.state.defaultSpecies}
          setSiteOverlay={this.state.setSiteOverlay}
          siteStructure={this.state.siteStructure}
        />
      );

      return (
        <HashRouter>
          <div className={styles.gridContainer}>
            <div className={styles.header}>
              <Button
                variant="text"
                href="https://catalogue.ceda.ac.uk/uuid/f5b38d1654d84b03ba79060746541e4f"
                target="_blank"
                startIcon={<LaunchIcon />}
                style={{ color: "#97FEED" }}
              >
                Visit DECC Public Data
              </Button>
              <div className={styles.menuIcon}>
                <TextButton styling="light" extraStyling={{ fontSize: "1.6em" }} onClick={this.toggleSidebar}>
                  &#9776;
                </TextButton>
              </div>
            </div>
            <aside className={styles.sidebar} style={extraSidebarStyle}>
              <ControlPanel
                layoutMode={this.state.layoutMode}
                setOverlay={this.setOverlay}
                toggleOverlay={this.toggleOverlay}
                closePanel={this.toggleSidebar}
              >
                <Link to="/" className={styles.navLink}>
                  Live Data
                </Link>
                <Link to="/FAQ" className={styles.navLink}>
                  FAQ
                </Link>
              </ControlPanel>
            </aside>
            <Routes>
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/" element={liveData} />
            </Routes>
            {overlay}
          </div>
        </HashRouter>
      );
    }
  }
}

export default Dashboard;
