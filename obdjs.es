var net = require('net');

var HOST = '192.168.0.10';
var PORT = 35000;

var client = net.createConnection(PORT, HOST);

// var sample_response = 'BE3FA811';

//Sample 01 01
//81 07 65 04

//Sample 03:
// 48 6B 09 43 04 20 01 39 00 00 5D

// var sample_response = 'BE1FA813';


var sample_response = '48 6B 09 43 04 20 01 39 00 00 5D';

function hexToByteArray(hex){
  hex = hex.replace(/\s/g, '');
  var splitHex = hex.match(/.{1,2}/g);
  console.log("Splite hex: ", splitHex);
  var byteArray = [];
  for (byte in splitHex) {
    var byteString = Hex2Bin(splitHex[byte]).toString();
    if (byteString.length < 8){
      var discrepancy = byteString.length;
      for (var i = 0; i < (8 - discrepancy); i++) {
        var splitBytes = byteString.split('');
        splitBytes.unshift('0');
        byteString = splitBytes.join('');
      }
    }
    byteArray.push(byteString);
  }
  return byteArray;
}

function interpretPCodes(pcodeArray){
    var iteratorLimit = pcodeArray.length;
    for (var i = 0; i < iteratorLimit; i++){
      var pcodeBytes = pcodeArray.slice(i * 2, i * 2 + 2).join('');
      console.log("Pcode Bytes: ", pcodeBytes);
    }
}

function Hex2Bin(n){if(!checkHex(n))return 0;return parseInt(n,16).toString(2)}
function checkHex(n){return/^[0-9A-Fa-f]{1,64}$/.test(n)}

console.log("Tester: ", interpretPCodes(hexToByteArray(sample_response)));

client.setEncoding('utf-8');
client.on('connect', function(data){
  var pcode = '02';
  console.log("Initialization for Pcode: ", pcode);
  client.write(pcode + '\r\n\0');
});

client.on('data', function(data) {
  console.log('DATA: ' + data);
  console.log('Hex to String: ' + hexToByteArray(data));
  // Close the client socket completely
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});




