// services/api-service.js

const axios = require('axios');
const authService = require('./auth-service');
var unityIns = null;

async function getPrivateData() {
  const result = await axios.get('http://localhost:3000/private', {
    headers: {
      'Authorization': `Bearer ${authService.getAccessToken()}`,
    },
  });
  return result.data;
}

function setUnity(ins) {
  unityIns = ins;
  return "set";
}

function getUnity()
{
  return unityIns;
}

module.exports = {
  getPrivateData,
  getUnity,
  setUnity
}