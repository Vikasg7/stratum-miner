# stratum-miner  
A stratum based crypto miner in Nodejs written in functional style for mining crypto currency.

# Usage
```
npm start -- [options]

Options:  
          --version  Show version number                             [boolean]  
      -s, --server   stratum+tcp://host:port               [string] [required]  
      -u, --user     username                              [string] [required]  
      -p, --pass     password                              [string] [required]  
      -i, --id       worker id                             [string] [required]  
      -t, --threads  threads                  [number] [required] [default: 1]  
      -a, --algo     sha256, scrypt    [number] [required] [default: "scrypt"]     
          --help     Show help                                       [boolean]  
```
# Command  
`npm start -- -s <stratum+tcp://host:port> -u <username> -p <password> -i <id> -t <threads> -a <algo>`  

# Did it work?
Yes! it worked. I setup my own local mining pool server based on dogecoin testnet and was able to mine [3208673](https://sochain.com/block/DOGETEST/3208673), [3208676](https://sochain.com/block/DOGETEST/3208676), [3208678](https://sochain.com/block/DOGETEST/3208678). Check out my [testdoge-mining-pool](https://github.com/Vikasg7/testdoge-mining-pool) repo for details on setting up a test mining pool.