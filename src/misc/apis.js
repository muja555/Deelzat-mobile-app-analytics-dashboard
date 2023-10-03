const BIGQUERY_FUNCTIONS = process.env.REACT_APP_URL_BIGQUERY;
//const BIGQUERY_FUNCTIONS = 'http://localhost:5001/deelzat-76871/us-central1';
let SEND_MESSAGE_API =  process.env.REACT_APP_URL_MESSAGEAPI;
const SEND_MESSAGE_API_STAGING = process.env.REACT_APP_URL_MESSAGEAPI_STAGING;
//const algoliasearch = require("algoliasearch");

const excuteQuery = (queryStr) => {

    const body = JSON.stringify({
        query: queryStr
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        },
        body
    };
    return fetch(`${BIGQUERY_FUNCTIONS}/bigquery/excuteQuery`, requestOptions);
}
export {excuteQuery as excuteQuery}


const getRandomPokemon = () => {
    return new Promise((resolve, reject) => {
        fetch('https://pokeapi.co/api/v2/pokemon?limit=1000')
            .then(response => response.json())
            .then((data) => {
                let randNum = Math.abs(Math.floor(Math.random() * (0 - 1000)))
                let pokeArr = data['results']
                let randPoke = pokeArr[randNum]

                fetch(randPoke['url'])
                    .then(res => res.json())
                    .then(resolve)
            })
            .catch(reject);
    });
}
export {getRandomPokemon as getRandomPokemon}


const sendNotification = (title, message, imageUrl, userIds, isStaging) => {

    // google-oauth2|102249163789441627142
    const body = {
        user_ids: userIds,
        title,
        message,
        image: imageUrl,
    };


    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(body)
    };
    return fetch(isStaging? SEND_MESSAGE_API_STAGING: SEND_MESSAGE_API,
        requestOptions);
}
export {sendNotification as sendNotification}


export function getAlgoliaProductsWithLastUpdate(daysAgo)  {
    //
    // return new Promise((resolve, reject) => {
    //     const client = algoliasearch("Q93IWREB96", "1d24ef5fe71775faf7858b5458dd8e5c");
    //     client.initIndex("products")
    //         .browseObjects({
    //             filters: '',
    //             attributesToRetrieve: ['id', 'title', 'updated_at', 'vendor', 'named_tags', 'meta'],
    //             attributesToHighlight: [],
    //             attributesToSnippet: [],
    //             batch: resolve
    //         })
    //         .catch(console.warn);
    // })
}

