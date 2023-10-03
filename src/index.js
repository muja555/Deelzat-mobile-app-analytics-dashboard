import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './trusted-security-policies';
import {Auth0Provider} from "@auth0/auth0-react";

const auth0_domain = process.env.REACT_APP_AUTH0_DOMAIN
const auth0_clientId = process.env.REACT_APP_AUTH0_CLIENTID
const auth0_audience = process.env.REACT_APP_AUTH0_AUDIENCE

ReactDOM.render(
    <React.StrictMode>
        <Auth0Provider
            domain={auth0_domain}
            clientId={auth0_clientId}
            redirectUri={window.location.origin}
            scope={'openid profile email'}
            audience={auth0_audience}
            connection={'DeelzatGoogleWorkspace'}
            cacheLocation={'localstorage'}
            useRefreshTokens={true}
            useCookiesForTransactions={true}
        >
            <App />
        </Auth0Provider>,
    </React.StrictMode>
    ,
    document.getElementById('root')
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
