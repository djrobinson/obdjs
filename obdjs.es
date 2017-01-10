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

function startupSequence(){
    client.write('ATZ\r\n\0');
    setTimeout(client.write('ATE0\r\n\0'), 1000);
    setTimeout(client.write('ATH1\r\n\0'), 1500);
    setTimeout(client.write('ATL1\r\n\0'), 2000);
}


var bitIndexer = ['A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1', 'B0', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1', 'C0', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];

function bit(pos) {
  return bitIndexer.indexOf(pos);
}

function statusSinceDTCCleared(hexArray){
  var hexstring = hexArray.join('');
  console.log("MIL: ", hexstring[0]);
  console.log("DTC_CNT: ", hexstring[1]);
  console.log("COMPONENTS: ", hexstring[bit('B2')], hexstring[bit('B6')]);
  console.log("FUEL SYSTEM: ", hexstring[bit('B1')], hexstring[bit('B5')]);
  console.log("MISFIRE: ", hexstring[bit('B0')], hexstring[bit('B4')]);
  console.log("EGR SYSTEM: ", hexstring[bit('C7')], hexstring[bit('D7')]);
  console.log("OXYGEN SENSOR HEATER: ", hexstring[bit('C6')], hexstring[bit('D6')]);
  console.log("OXYGEN SENSOR: ", hexstring[bit('C5')], hexstring[bit('D5')]);
  console.log("AC REFRIGERANT: ", hexstring[bit('C4')], hexstring[bit('D4')]);
  console.log("SECONDARY AIR SYSTEM: ", hexstring[bit('C3')], hexstring[bit('D3')]);
  console.log("EVAPORATIVE SYSTEM: ", hexstring[bit('C2')], hexstring[bit('D2')]);
  console.log("HEATED CATALYST: ", hexstring[bit('C1')], hexstring[bit('D1')]);
  console.log("CATALYST: ", hexstring[bit('C0')], hexstring[bit('D0')]);
  console.log("EGR / VVT SYSTEM: ", hexstring[bit('C7')], hexstring[bit('D7')]);
  console.log("PM FILTER MONITORING: ", hexstring[bit('C6')], hexstring[bit('D6')]);
  console.log("EXHAUST GAS SENSOR: ", hexstring[bit('C5')], hexstring[bit('D5')]);
  console.log("BOOST PRESSURE: ", hexstring[bit('C4')], hexstring[bit('D4')]);
  console.log("NOX / SCR MONITOR: ", hexstring[bit('C1')], hexstring[bit('D1')]);
  console.log("NMHC CATALYST: ", hexstring[bit('C0')], hexstring[bit('D0')]);

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
  console.log("Byte Array: ", byteArray);
  return byteArray;
}

function decodeMPH(a) {
  return a;
}

function decodeRPM(a, b) {
  return (256 * a + b) / 2;
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
      var DTCode = DTCodeMapper(pcodeBytes);
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

console.log("Tester: ", statusSinceDTCCleared(hexToByteArray(sample_response)));

// client.setEncoding('utf-8');
// client.on('connect', function(data){
//   var pcode = '02';
//   console.log("Initialization for Pcode: ", pcode);
//   client.write(pcode + '\r\n\0');
// });

// client.on('data', function(data) {
//   console.log('DATA: ' + data);
//   console.log('Hex to String: ' + hexToByteArray(data));
//   // Close the client socket completely
// });

// // Add a 'close' event handler for the client socket
// client.on('close', function() {
//     console.log('Connection closed');
// });




