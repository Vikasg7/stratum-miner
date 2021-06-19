# stratum-miner  
A stratum based scrypt crypto miner in Nodejs written in functional style for mining scrypt based coins like dogecoin and litecoin.  

# Usage  
`npm start -- -a <stratum+tcp://host:port> -u <username> -p <password> -i <id> -t <threads>`  

# Did it work?
Yes! it worked. I setup my own local mining pool server based on dogecoin testnet and was able to mine [3208673](https://sochain.com/block/DOGETEST/3208673), [3208676](https://sochain.com/block/DOGETEST/3208676), [3208678](https://sochain.com/block/DOGETEST/3208678). Check out my [testdoge-mining-pool](https://github.com/Vikasg7/testdoge-mining-pool) repo for details on setting up a test mining pool.