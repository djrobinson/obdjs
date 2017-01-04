var net = require('net');
var codes = require('./pcodes');

var HOST = '192.168.0.10';
var PORT = 35000;

// var client = net.createConnection(PORT, HOST);

//Sample 01 01:
// 81 07 65 04
//Sample 03:
// 48 6B 09 43 04 20 01 39 00 00 5D
//Sample 01 00:
// BE1FA813

var sample_response = '48 6B 09 43 04 20 01 39 00 00 5D';

class Device {
  startupSequence(){
    client.write('ATZ\r\n\0');
    client.write('ATE0\r\n\0');
    client.write('ATH1\r\n\0');
    client.write('ATL1\r\n\0');
  }

}

function statusSinceDTCCleared(){

}

function hexToByteArray(hex){
  hex = hex.replace(/\s/g, '');
  var splitHex = hex.match(/.{1,2}/g);
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

function interpretDTCodes(hex){
    var pcodeArray = hexToByteArray(hex);
    if (pcodeArray[0] === '01001000' && pcodeArray[1] === '01101011'){
      pcodeArray.shift();
      pcodeArray.shift();
    }
    var iteratorLimit = pcodeArray.length;
    var CurrentDTCodes = [];
    for (var i = 0; i < iteratorLimit / 2; i++){
      var pcodeBytes = pcodeArray.slice(i * 2, i * 2 + 2).join('');
      var DTCode = DTCodeMapper(pcodeBytes)
      if (DTCode){
        CurrentDTCodes.push(DTCode);
      }
    }
    return  CurrentDTCodes;
}

function DTCodeMapper(twobytestring){
    var twobyte = twobytestring.split('');
    var firstCharByte = twobyte.slice(0, 2).join('');
    var secondCharByte = twobyte.slice(2, 4).join('');
    var thirdCharByte = twobyte.slice(4, 8).join('');
    var fourthCharByte = twobyte.slice(8, 12).join('');
    var fifthCharByte = twobyte.slice(12, 16).join('');
    var firstCharMapper = {
        '00': 'P',
        '01': 'C',
        '10': 'B',
        '11': 'U'
    };

    var secondCharMapper = {
        '00':  '0',
        '01':  '1',
        '10':  '2',
        '11':  '3'
    };

    var lastCharsMapper = {
        '0000':  '0',
        '0001':  '1',
        '0010':  '2',
        '0011':  '3',
        '0100':  '4',
        '0101':  '5',
        '0110':  '6',
        '0111':  '7',
        '1000':  '8',
        '1001':  '9',
        '1010':  'A',
        '1011':  'B',
        '1100':  'C',
        '1101':  'D',
        '1110':  'E',
        '1111':  'F'
    };
    var firstChar = firstCharMapper[firstCharByte];
    var secondChar = secondCharMapper[secondCharByte];
    var thirdChar = lastCharsMapper[thirdCharByte];
    var fourthChar = lastCharsMapper[fourthCharByte];
    var fifthChar = lastCharsMapper[fifthCharByte];

    if (!firstChar || !secondChar || !thirdChar || !fourthChar || !fifthChar){
      return;
    }

    var Code = firstChar + secondChar + thirdChar + fourthChar + fifthChar;
    var Summary = codes.pcodes[Code];
    if (!Summary){
      return;
    }
    return {Code, Summary};

}

function Hex2Bin(n){if(!checkHex(n))return 0;return parseInt(n,16).toString(2)}
function checkHex(n){return/^[0-9A-Fa-f]{1,64}$/.test(n)}



class Sensor {
  constructor(shortName, name, code, valueFunc, unit){
    this.shortName = shortName;
    this.name = name;
    this.code = code;
    this.valueFunc = valueFunc;
    this.unit = unit;
  }
}

var sensors = {
    'pids': new Sensor("pids", "Supported PIDs", "0100", Hex2Bin, ""),
    'dtc_status': new Sensor("dtc_status", "Status Since DTC Cleared", "0101", "", ""),
    'active_dtcs': new Sensor("active_dtcs", "Active DTCs since DTC Cleared", "03",  "interpretDTCodes", "")
};

console.log("Tester: ", sensors.active_dtcs);

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




