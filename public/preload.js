// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extention.
/*const dgram = require("dgram");

var socket = dgram.createSocket("udp4")
var s = dgram.createSocket('udp4');

window.net = require('net');

window.udpSocket = {
    initSimulatorSocket: (ipAddress) => {
        s.on('message', function (msg, rinfo) {
            console.log('I got this message: ' + msg.toString());
        });
        s.bind(9051);
        socket.send(Buffer.from("reset"), 9050, ipAddress, function (error) {
            console.log("send reset message")
        });
    },
    sendDataToSimulator: (ipAddress, message) => {
        console.log("sending " + message)
        socket.send(Buffer.from(message), 9050, ipAddress);
    },
    close: () => {
        s.close();
        socket.close();
    }
}*/

const { /*contextBridge,*/ipcRenderer } = require("electron");

// API Definition
const electronAPI = {
  getProfile: () => ipcRenderer.invoke('auth:get-profile'),
  logOut: () => ipcRenderer.send('auth:log-out'),
  logIn: () => ipcRenderer.send('auth:log-in'),
  getPrivateData: () => ipcRenderer.invoke('api:get-private-data'),
  getLeaderboard: () => ipcRenderer.invoke('api:get-leaderboard'),
  setLeaderboard: (inp) => ipcRenderer.invoke('api:set-leaderboard',inp),
  setUnityInstance: (ins) => ipcRenderer.invoke('api:set-unity',ins),
  getUnityInstance: () => ipcRenderer.invoke('api:get-unity'),
  reloadWindow: ()=> ipcRenderer.invoke('api:reload-main'),
};
window.electronAPI = electronAPI;
/*
// Register the API with the contextBridge
process.once("loaded", () => {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
});*/