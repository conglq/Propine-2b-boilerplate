# Propine-2b-boilerplate
Write a command line program that returns the latest portfolio value per token in USD

## Install
```
npm install
```

## Start
```
npm start
```

## Solution explain
1. Read file csv to get all transaction. Because csv file could be big size so I use read stream instead of load full file and get balance of the token when read each row in csv to save performance.
2. With latest balance of token I got from previous function. I call API to get price of token with limit 3 requests at the same time to make sure cryptocompare don't block my spam request :)
3. Print portfolio of tokens.
