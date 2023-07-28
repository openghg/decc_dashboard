import React from "react";
import { Routes, Route, Link, HashRouter } from "react-router-dom";
import { cloneDeep, has, set} from "lodash";

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
import deccMeasData from "./data/decc_example.json";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      showSidebar: false,
      selectedDate: 0,
      processedData: {},
      dataKeys: {},
      selectedKeys: {},
      footprintView: true,
      emptySelection: true,
      overlayOpen: false,
      overlay: null,
      plotType: "footprint",
      layoutMode: "dashboard",
      colours: {},
    };

    // Build the site info for the overlays
    this.buildSiteInfo();

    // Select the data
    this.dataSelector = this.dataSelector.bind(this);
    // Selects the dates
    this.sourceSelector = this.sourceSelector.bind(this);
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.setOverlay = this.setOverlay.bind(this);
    this.speciesSelector = this.speciesSelector.bind(this);
    this.clearSources = this.clearSources.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.setSiteOverlay = this.setSiteOverlay.bind(this);
  }

  buildSiteInfo() {
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

    this.setState({ selectedSources: selectedSources });
  }

  clearSources() {
    this.setState({ selectedSources: new Set() });
  }

  speciesSelector(species) {
    const speciesLower = species.toLowerCase();

    const selectedSourcesClone = cloneDeep(this.state.selectedSources);

    this.setState({ selectedSources: new Set() }, () => {
      this.sourceSpeciesChange(species, selectedSourcesClone);
    });

    this.setState({ selectedSpecies: speciesLower });
  }

  sourceSpeciesChange(species, oldSelectedSources) {
    const processedData = this.state.processedData;
    const speciesData = processedData[species];

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

  processData(rawData) {
    // Process the data and create the correct Javascript time objects
    // expected by plotly

    // NOTE - I use data source here, please don't confuse with an OpenGHG Datasource,
    let dataKeys = {};
    let processedData = {};
    let siteStructure = {};

    let defaultSpecies = null;
    let defaultSourceKey = null;
    let defaultNetwork = null;

    let count = 0;

    try {
      for (const [species, networkData] of Object.entries(rawData)) {
        if (!defaultSpecies) {
          defaultSpecies = species;
        }
        for (const [network, siteData] of Object.entries(networkData)) {
          if (!defaultNetwork) {
            defaultNetwork = network;
          }
          for (const [site, inletData] of Object.entries(siteData)) {
            for (const [inlet, instrumentData] of Object.entries(inletData)) {
              for (const [instrument, measurementData] of Object.entries(instrumentData)) {
                // Data key
                const sourceKey = `${network}_${site}_${inlet}_${instrument}`;
                const nestedPath = `${species}.${network}.${site}.${inlet}.${instrument}`;

                if (!defaultSourceKey) {
                  defaultSourceKey = sourceKey;
                }

                // We create a nested object for easy automated creation of the interface
                set(siteStructure, nestedPath, sourceKey);

                // Create the data structures expected by plotly
                const timeseriesData = measurementData["data"];
                const metadata = measurementData["metadata"];
                const rawData = timeseriesData[species];

                const x_timestamps = Object.keys(rawData);
                const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
                const y_values = Object.values(rawData);

                const graphData = {
                  x_values: x_values,
                  y_values: y_values,
                };

                const dataKey = `${species}.${sourceKey}`;


                const combinedData = { data: graphData, metadata: metadata};

                set(processedData, dataKey, combinedData);
;
              }
            }
          }

        }
      }
    } catch (error) {
      console.error(`Error processing raw data - ${error}`);
    }

    // Disabled the no direct mutation rule here as this only gets called from the constructor
    /* eslint-disable react/no-direct-mutation-state */
    // Give each site a colour
    this.state.defaultSpecies = defaultSpecies;
    this.state.defaultNetwork = defaultNetwork;
    this.state.defaultSourceKey = defaultSourceKey;
    this.state.selectedSources = new Set([defaultSourceKey]);
    this.state.selectedSpecies = defaultSpecies;
    this.state.processedData = processedData;
    this.state.selectedKeys = dataKeys;
    this.state.isLoaded = true;
    this.state.siteStructure = siteStructure;
    /* eslint-enable react/no-direct-mutation-state */
  }

  dataSelector(dataKeys) {
    this.setState({ selectedKeys: dataKeys });
  }

  componentDidMount() {
    this.processData(deccMeasData);
    this.setState({ isLoaded: true });
    // const apiURL = "https://raw.githubusercontent.com/openghg/dashboard_data/main/combined_data.json";
    // fetch(apiURL)
    //   .then((res) => res.json())
    //   .then(
    //     (result) => {
    //       this.processData(result);
    //       this.setState({
    //         isLoaded: true,
    //       });
    //     },
    //     (error) => {
    //       this.setState({
    //         isLoaded: true,
    //         error,
    //       });
    //     }
    //   );
  }

  anySelected() {
    for (const subdict of Object.values(this.state.selectedKeys)) {
      for (const value of Object.values(subdict)) {
        if (value === true) {
          return true;
        }
      }
    }

    return false;
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
          dataSelector={this.dataSelector}
          clearSources={this.clearSources}
          speciesSelector={this.speciesSelector}
          sourceSelector={this.sourceSelector}
          processedData={this.state.processedData}
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
