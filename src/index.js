const yargs = require("yargs")
const { main } = require("./miner")
const { log } = require("console")

const args =
   yargs
      .usage("npm start -- [options]")
      .options({
         "a": {
            type: "string",
            demandOption: true,
            describe: "stratum+tcp://host:port",
            alias: "address"
         },
         "u": {
            type: "string",
            demandOption: true,
            describe: "username",
            alias: "user"
         },
         "p": {
            type: "string",
            demandOption: true,
            describe: "password",
            alias: "pass"
         },
         "i": {
            type: "string",
            demandOption: true,
            describe: "worker id",
            alias: "id"
         },
         "t": {
            type: "number",
            demandOption: true,
            describe: "threads",
            alias: "threads",
            default: 1
         }
      })
      .help()
      .argv

main(args).subscribe(null, log)