import "./Dashboard.css";
import React from "react";
// import randomData from "./random.json";
import { v4 as uuidv4 } from "uuid";
import { createSites } from "./mock/randomSites.js";

import randomData from "./mock/randomSiteData.json";

import LineChart from "./components/LineChart/LineChart";
import LeafletMap from "./components/LeafletMap/LeafletMap";

// import Header from "./components/Header/Header";
import Summary from "./components/Summary/Summary";
import Overview from "./components/Overview/Overview";
import VisLayout from "./components/VisLayout/VisLayout";
import ControlPanel from "./components/ControlPanel/ControlPanel";

import GraphContainer from "./components/GraphContainer/GraphContainer";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      sidePanel: false,
      apiData: [],
    };

    // For the moment create some fake sites
    this.state.sites = createSites();
    // This data will come from a function but for now just read it in
    this.state.apiData = this.processData();

    this.toggleSidePanel = this.toggleSidePanel.bind(this);
    this.dataSelector = this.dataSelector.bind(this);
    this.processData = this.processData.bind(this);
  }

  // Need a function to process the data that's keyed
  processData() {
    // const data = this.state.apiData;
    const data = randomData;

    // Process the data and create the correct Javascript time objects
    let dataKeys = {};
    let processedData = {};

    for (const site of Object.keys(data)) {
      dataKeys[site] = {};
      processedData[site] = {};

      for (const species of Object.keys(data[site])) {
        dataKeys[site][species] = false;

        const gas_data = data[site][species];

        const x_timestamps = Object.keys(gas_data);
        const x_values = x_timestamps.map((d) => new Date(parseInt(d)));
        // Extract the count values
        const y_values = Object.values(gas_data);

        // Create a structure that plotly expects
        processedData[site][species] = {
          x_values: x_values,
          y_values: y_values,
        };
      }
    }

    // Disabled the no direct mutation rule here as this only gets called from the ctor
    /* eslint-disable react/no-direct-mutation-state */
    this.state.processedData = processedData;
    this.state.dataKeys = dataKeys;
    /* eslint-enable react/no-direct-mutation-state */
  }

  dataSelector(dataKeys) {
    this.setState({ selectedKeys: dataKeys });
  }

  createGraphs() {
    // Use the data keys to create the plots here
    const colours = ["#013a63", "#2a6f97", "#014f86"];

    // The keys we want to plot
    let visualisations = [];

    const selectedKeys = this.state.selectedKeys;

    if (selectedKeys) {
      // Loop through the selected data keys and if true create a plot
      for (const [site, subObj] of Object.entries(selectedKeys)) {
        for (const [species, value] of Object.entries(subObj)) {
          if (value) {
            // Create a visualisation and add it to the list
            const data = randomData[site][species];
            const title = `${String(site).toUpperCase()} - ${String(
              site
            ).toUpperCase()}`;

            const vis = (
              <GraphContainer>
                <LineChart
                  divID={this.getID()}
                  data={data}
                  colour={colours[1]}
                  title={title}
                  xLabel="Date"
                  yLabel="Concentration"
                  key={title}
                />
              </GraphContainer>
            );

            visualisations.push(vis);
          }
        }
      }
    }

    return visualisations;
  }

  componentDidMount() {
    // const apiURL = "";
    // fetch(apiURL)
    //   .then((res) => res.json())
    //   .then(
    //     (result) => {
    //       this.setState({
    //         isLoaded: true,
    //         weatherData: result,
    //         // or apiData
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

  getID() {
    // Create a unique ID for each visualisation
    return "vis-id-" + uuidv4();
  }

  toggleSidePanel() {
    this.setState({ sidePanel: !this.state.sidePanel });
  }

  render() {
    let { error, isLoaded } = this.state;

    // console.log(this.state.dataKeys);

    // Just set this as true for now as we're not pulling anything
    // from an API
    isLoaded = true;

    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      const gas_data_a = randomData["gas_a"];
      const gas_data_b = randomData["gas_b"];
      const gas_data_c = randomData["gas_c"];

      // Break the header into a component?
      // Break the cards into components?
      // How will visualisations scale?
      // Have a VisLayout component that takes

      return (
        <div className="grid-container">
          <div className="header">
            <div onClick={this.toggleSidePanel} className="nav-icon">
              <div></div>
            </div>
            LondonGHG Dashboard
          </div>
          <div className="main">
            <div className="main-side">
              <ControlPanel
                dataKeys={this.state.dataKeys}
                dataSelector={this.dataSelector}
              />
            </div>
            <div className="main-panel">
              <LeafletMap
                divID={this.getID()}
                sites={this.state.sites}
                centre={[51.458377, -2.603017]}
                zoom={5}
                width={"75vw"}
                height={"65vh"}
              />
              <Summary>
                <div>
                  Glasgow is the third most populous city in the United Kingdom,
                  with an estimated city population of 612,040 in 2016.
                </div>
              </Summary>

              <Overview />

              <VisLayout>{this.createGraphs()}</VisLayout>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Dashboard;
