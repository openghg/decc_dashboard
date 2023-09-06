import React from "react";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import { cloneDeep, has, set, get } from "lodash";

import ControlPanel from "./components/ControlPanel/ControlPanel";
import OverlayContainer from "./components/OverlayContainer/OverlayContainer";

import Overlay from "./components/Overlay/Overlay";
import FAQ from "./components/FAQ/FAQ";
import LiveData from "./components/LiveData/LiveData";
import Explainer from "./components/Explainer/Explainer";

import { importSiteImages, createSourceKey } from "./util/helpers";
import styles from "./Dashboard.module.css";

// Site description information
import siteInfoJSON from "./data/siteInfo.json";
import { Button, MenuItem } from "@mui/material";

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

    this.dataRepoURL = "https://raw.githubusercontent.com/openghg/temp_data_dashboard/main/";

    this.sourceSelector = this.sourceSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSources = this.clearSources.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  // These handle the initial setup of the app

  /**
   * Read the config file to setup the default site, species etc
   */
  setupDefaults() {
    throw new Error("Not implemented.");
    // this.state...
  }

  /**
   * Converts data to the format required by Plotly
   *
   * @param {object} data - Data object
   *
   */
  toPlotly(data) {
    const x_timestamps = Object.keys(data);
    const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
    const y_values = Object.values(data);

    return {
      x_values: x_values,
      y_values: y_values,
    };
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
    const forPlotly = this.toPlotly(data);
    // Now update the current dataStore with the new data
    this.setState((prevState) => {
      set(prevState.dataStore, sourceKey, forPlotly);
      return prevState;
    });
  }

  /**
   * Retrieves data from the given URL and processes it into a format
   * plotly can read
   *
   * @param {string} sourceKey - Source key
   *
   */
  retrieveData(sourceKey) {
    const filename = get(this.state.filenameLookup, sourceKey, null);
    if (filename === null) {
      console.error(`No filename available for ${sourceKey}`);
      return;
    }

    const currentVal = get(this.state.dataStore, sourceKey);
    if (currentVal !== null) {
      console.log(`We already have data for ${sourceKey}`);
      return;
    }

    const url = new URL(filename, this.dataRepoURL).href;

    console.log(`Retrieving data from ${url}`);
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
    // this.state.completeMetadata = metadata;
    let defaultSpecies = null;
    let defaultSite = null;
    let defaultInlet = null;
    // Not sure if we need default instrument but
    // let defaultInstrument = null;
    let defaultNetwork = null;
    let defaultSourceKey = null;
    // We just need to pull out the initial data
    // We retrieve only the first dataset and then populate the other data values with nulls
    // When this data is selected the app will retrieve the data

    // Store the data itself
    let dataStore = {};
    // Store the metadata for each source
    let metaStore = {};
    // Store the structure to allow easy building of the interface dynamically
    let siteStructure = {};
    // Do we need filename lookup?
    let filenameLookup = {};

    try {
      for (const [species, networkData] of Object.entries(metadata)) {
        if (defaultSpecies === null) defaultSpecies = species;
        for (const [network, siteData] of Object.entries(networkData)) {
          if (defaultNetwork === null) defaultNetwork = network;
          for (const [site, inletData] of Object.entries(siteData)) {
            if (defaultSite === null) defaultSite = site;
            for (const [inlet, instrumentData] of Object.entries(inletData)) {
              if (defaultInlet === null) defaultInlet = inlet;
              for (const [instrument, fileMetadata] of Object.entries(instrumentData)) {
                // The complete source key should always have the species at the start
                // Then we use the lodash set, get etc commands to easily access the objects
                const completeSourceKey = createSourceKey(species, network, site, inlet, instrument);
                // We'll use this to create a lightweight structure for the creation of the interface
                const nestedSourceKey = `${species}.${network}.${site}.${inlet}.${instrument}`;

                const filepath = fileMetadata["filepath"];

                // We retrieve the data for the default source
                // and store a null in all the sources we don't retrieve
                if (defaultSourceKey === null) {
                  defaultSourceKey = completeSourceKey;
                  const url = new URL(filepath, this.dataRepoURL).href;
                  // Here we add the data directly as this is on first load
                  retrieveJSON(url).then((result) => {
                    console.log(`Retrieving data from ${url}`);
                    const forPlotly = this.toPlotly(result);
                    set(dataStore, completeSourceKey, forPlotly);
                  });
                } else {
                  set(dataStore, completeSourceKey, null);
                }

                const sourceMetadata = fileMetadata["metadata"];
                set(metaStore, completeSourceKey, sourceMetadata);
                set(siteStructure, nestedSourceKey, completeSourceKey);
                // Save the filepath in the data repository for each lookup using the source key
                set(filenameLookup, completeSourceKey, filepath);
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
    this.state.metaStore = metaStore;
    this.state.siteStructure = siteStructure;
    this.state.filenameLookup = filenameLookup;
    this.state.defaultSpecies = defaultSpecies;
    this.state.selectedSources = new Set([defaultSourceKey]);
    this.state.selectedSpecies = defaultSpecies;
    this.state.isLoaded = true;
    /* eslint-enable react/no-direct-mutation-state */
  }

  componentDidMount() {
    // Retrieve the metadata
    const metadata_filename = "metadata_complete.json";
    const metadataURL = new URL(metadata_filename, this.dataRepoURL);

    retrieveJSON(metadataURL).then(
      (metadata) => {
        this.populateAndRetrieve(metadata);
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
   * Selects a data source using a selected sourceKey
   *
   * @param {string} selection - Key for a data source
   */
  sourceSelector(selection) {
    console.log(selection);
    let selectedSourcesSet = new Set();

    if (selection instanceof Set) {
      selectedSourcesSet = selection;
    } else {
      selectedSourcesSet.add(selection);
    }

    // Here we change all the sites and select all species / sectors at that site
    let selectedSources = cloneDeep(this.state.selectedSources);

    for (const sourceKey of selectedSourcesSet) {
      if (selectedSources.has(sourceKey)) {
        selectedSources.delete(sourceKey);
      } else {
        selectedSources.add(sourceKey);
      }
    }

    // Now let's make sure we have all the data for these new selections
    // the source will be the key in the
    for (const sourceKey of selectedSources) {
      this.retrieveData(sourceKey);
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

    // Here we want the default key of another species
    if (newSources.size === 0) {
      const defaultSource = Object.keys(speciesData)[0];
      // This just gives us a partial key, we need to add in the species to get
      // a complete sourceKey
      const sourceKey = `${species}.${defaultSource}`
      newSources.add(sourceKey);
    }

    this.sourceSelector(newSources);
  }

  toggleOverlay() {
    this.setState({ overlayOpen: !this.state.overlayOpen });
  }

  setOverlay(overlay) {
    this.setState({ overlayOpen: true, overlay: overlay });
  }

  /** Toggles the sidebar */
  toggleSidebar() {
    this.setState({ showSidebar: !this.state.showSidebar });
  }

  /** Was used to set an overlay of the site and show an image, currently unused
   * @deprecated
   *
   */
  setSiteOverlay(e) {
    console.warn("Deprecated function. May be removed.");
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
          metaStore={this.state.metaStore}
          siteStructure={this.state.siteStructure}
          selectedSources={this.state.selectedSources}
          selectedKeys={this.state.selectedKeys}
          selectedSpecies={this.state.selectedSpecies}
          defaultSpecies={this.state.defaultSpecies}
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
                <MenuItem styling="light" extrastyling={{ fontSize: "1.6em" }} onClick={this.toggleSidebar}>
                  &#9776;
                </MenuItem>
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
                <Link to="/explainer" className={styles.navLink}>
                  Background
                </Link>
              </ControlPanel>
            </aside>
            <Routes>
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/" element={liveData} />
              <Route path="/explainer" element={<Explainer />} />
            </Routes>
            {overlay}
          </div>
        </HashRouter>
      );
    }
  }
}

export default Dashboard;
