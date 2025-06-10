const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');
const axios = require('axios');
const url = require('url');
const envVariables = require('../env-variables');
const keytar = require('keytar');
const os = require('os');
const {decode} = jwt;
const {backendurl} = envVariables;

const redirectUri = 'http://localhost/callback';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;
const FormData = require('form-data');

let accessToken = null;
let profile = null;
let refreshToken = null;

function getAccessToken() {
    return accessToken;
  }
  
  function getProfile() {
    return profile;
  }
  

async function getLeaderboard() {
  console.log("getleader");
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

    const result = await axios.get(backendurl, {
        headers: {
          'Authorization': `Bearer `,
        },
      });
      console.log(result.data);
      return result.data;
}

async function sendToLeaderboard(inputData) {
    const refreshToken = await keytar.getPassword(keytarService, keytarAccount);
  
    if (refreshToken) {
      /*const refreshOptions = {
        method: 'POST',
        url: backendurl,
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        data: {
          uid: input.uid,
          points: input.points,
          game: input.game,
        }
      };*/

        var formData = new FormData();
        console.log(inputData);
        formData.append("uid",inputData.uid);
        formData.append("points",inputData.points);
        formData.append("game",inputData.game);
        formData.append("name",inputData.name);

        try {
            const response = await axios.post(backendurl,formData,{
            headers: {
                'Authorization': `Bearer `,
            }
            });
            console.log(response.data);
            
            accessToken = response.data.access_token;
            //window.accessToken = accessToken;
            profile = decode(response.data.id_token);
        } catch (error) {

            throw error;
        }
    } else {
      throw new Error("No available refresh token.");
    }
  }

async function loadTokens(callbackURL) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;

  const exchangeOptions = {
    'grant_type': 'authorization_code',
    'client_id': clientId,
    'code': query.code,
    'redirect_uri': redirectUri,
  };

  const options = {
    method: 'POST',
    url: `https://${auth0Domain}/oauth/token`,
    headers: {
      'content-type': 'application/json'
    },
    data: JSON.stringify(exchangeOptions),
  };

  try {
    
    const response = await axios(options);

    accessToken = response.data.access_token;
    profile = decode(response.data.id_token);
    refreshToken = response.data.refresh_token;
    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAccessToken,
  getProfile,
  loadTokens,
  sendToLeaderboard,
  getLeaderboard
};