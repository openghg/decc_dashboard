import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Auth0Provider } from "@auth0/auth0-react";
import Dashboard from './Dashboard';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <Auth0Provider
  domain="dev-bxz3gnvq366bchqj.us.auth0.com"
  clientId="V1wHiVGHGiRz3Y4LAwwbYk2scbUoxZgb"
  redirectUri={window.location.origin}
>
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
  </Auth0Provider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
