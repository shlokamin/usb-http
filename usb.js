var http = require("http");
var fetch = require("node-fetch");
var agent = require("agent-base");
var SP = require("serialport");

var SerialPort = SP.SerialPort;

function buildUSBAgent(opts) {
  console.log(`path is ${opts.serialPort}`);
  const port = new SerialPort({ path: opts.serialPort, baudRate: 115200 });
  console.log({port})
  port.read = (...args) => {
    console.log(`calling port.read with ${args}`);
    port.read(args);
  };
  port.write = (...args) => {
    console.log(`calling port.write with ${args}`);
    port.write(args);
  };
  const usbAgent = agent((req, opts) => {
    return port;
  });
  usbAgent.maxFreeSockets = 1;
  usbAgent.maxSockets = 1;
  usbAgent.maxTotalSockets = 1;
  usbAgent.destroy = () => port.close();
  return usbAgent;
}

const httpAgent = buildUSBAgent({ serialPort: "/dev/tty.usbmodem011219971" });

const options = {
  // These properties are part of the Fetch Standard
  method: "GET",
  headers: { "opentrons-version": "*" }, // Request headers. format is the identical to that accepted by the Headers constructor (see below)
  agent: () => httpAgent,
};

fetch("http://10.13.11.68:31950/modules", options).then((res) => {
  res.json().then(data => console.log(Object.values(data)))
});

