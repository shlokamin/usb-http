var http = require("http");
var fetch = require("node-fetch");
var agent = require("agent-base");
var SP = require("serialport");

var SerialPort = SP.SerialPort;

function buildUSBAgent(options) {
  console.log(`path is ${options.serialPort}`);

  const usbAgent = agent((req, opts) => {
    console.log("providing port for request");
    console.log({ req, opts });
    const port = new SerialPort({ path: options.serialPort, baudRate: 115200 });
    if (!port.isOpen && !port.opening) {
      port.open();
    }
    const originalRead = port.read.bind(port);
    const originalWrite = port.write.bind(port);
    const originalClose = port.close.bind(port);
    port.on("data", (chunk) => {
      console.log(`received chunk:  ${chunk}`);
      console.log("end chunk");
    });
    port.on("free", () => {
      console.log("closing port");
      port.close()
    });
    port.read = (...args) => {
      const result = originalRead(...args);
      console.log(`read result: ${result}`);
      return result;
    };
    port.write = (...args) => {
      console.log(`calling write with: ${args}`);
      const result = originalWrite(...args);
      console.log(`write result: ${result}`);
      return result;
    };
    port.close = (...args) => {
      const result = originalClose(...args);
      console.log(`close result: ${result}`);
      return result;
    };
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

fetch("http://10.13.11.68:31950/modules", options)
  .then((res) => {
    console.log("got first response header");
    console.log(res);
    return res.json();
  })
  .then((data) => {
    console.log("got the first response payload");
    console.log(Object.values(data));
    return Promise.resolve(true);
  })
  .catch((e) =>
    console.log(`uh oh, could not parse json properly 1st call ${e.message}`)
  )
  .then(() => {
    console.log("about to make second fetch request");
    return fetch("http://10.13.11.68:31950/modules", options);
  })
  .then((res) => {
    console.log("got the second response header");
    console.log(res);
    return res.json();
  })
  .then((data) => {
    console.log("got the second response payload");
    console.log(Object.values(data));
    return Promise.resolve(true);
  })
  .catch((e) =>
    console.log(`uh oh, could not parse json properly 2nd call ${e.message}`)
  );
