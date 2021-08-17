const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const Promise = require('bluebird');

function readTransactions(filePath) {
  return new Promise((resolve, reject) => {
    const tokensStatistic = {};
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', error => {
        console.error(error);
        return reject(error);
      })
      .on('data', row => {
        updateTokenStatisticByTransaction(row, tokensStatistic)
      })
      .on('end', rowCount => {
        console.debug(`Read ${rowCount} rows`);
        return resolve(tokensStatistic);
      });
  });
}

const HANDLE_NUMBER = 1000 * 1000 * 1000;
function updateTokenStatisticByTransaction({transaction_type, token, amount}, tokensStatistic) {
  if(!tokensStatistic[token]){
    tokensStatistic[token] = {
      amount: 0
    }
  }
  const tempAmount = parseFloat(amount) * HANDLE_NUMBER
  if(transaction_type === 'DEPOSIT'){
    tokensStatistic[token].amount += tempAmount
  }else {
    tokensStatistic[token].amount -= tempAmount
  }
}

const axios = require('axios');
function getCoinPrice(token, currency) {
  const url = `https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=${currency}`;
  return axios.get(url)
    .then(function (response) {
      console.debug('getCoinPrice', url);
      return response.data[currency];
    })
    .catch(function (error) {
      console.error('getCoinPrice', {url}, error);
      return null;
    });
}

async function updateValueOfToken({token, currency}, tokensStatistic, tokenPortfolio) {
  const price = await getCoinPrice(token, currency);
  if(price === null){
    return tokenPortfolio[token] = {
      price: 'Can not query price',
      amount,
      value: null
    }
  }
  const amount = tokensStatistic[token].amount / HANDLE_NUMBER;
  tokenPortfolio[token] = {
    price,
    amount,
    value: price * amount
  }
}

async function getLatestValueOfTokens(tokensStatistic, currency) {
  const tokenPortfolio = {};
  await Promise.map(Object.keys(tokensStatistic), token => updateValueOfToken({token, currency}, tokensStatistic, tokenPortfolio), {concurrency: 3});
  return tokenPortfolio
}

async function getTokenPortfolio() {
  const filePath = path.resolve(__dirname, 'data', 'transactions.csv');
  const tokensStatistic = await readTransactions(filePath);
  const currency = 'USD';
  return getLatestValueOfTokens(tokensStatistic, currency);
}

getTokenPortfolio().then((tokenPortfolio) => {
  console.log('Portfolio value per token in USD')
  console.log(tokenPortfolio)
  console.log('DONE');
}).catch(e => {
  console.error('Error to handle', e)
});