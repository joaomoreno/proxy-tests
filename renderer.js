// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');

const startButton = document.getElementById('start');
const resultsElement = document.getElementById('results');
const proxyInput = document.getElementById('proxy');

const httpUrl = 'http://code.visualstudio.com/docs';
const httpsUrl = 'https://code.visualstudio.com/docs';

function hash(contents) {
  return crypto.createHash('sha1').update(contents).digest('hex');
}

function runXHR(url) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onerror = () => {
      resolve({
        status: xhr.status,
        result: 'Error'
      });
    };
    xhr.onload = (e) => {
      resolve({
        status: xhr.status,
        result: hash(xhr.response)
      });
    };
    xhr.send();
  });
}

function run(proxyUrl) {
  resultsElement.textContent = 'Running tests...';

  const tests = [
    ['HTTP XHR', runXHR(httpUrl)],
    ['HTTPS XHR', runXHR(httpsUrl)]
  ];

  const promises = tests
    .map(([name, promise]) => promise.then(r => `| ${name} | ${r.status} | ${r.result} |`));

  Promise.all(promises).then(results => {
    const textarea = document.createElement('textarea');
    textarea.value = results.join('\n');
    resultsElement.innerHTML = '';
    resultsElement.appendChild(textarea);
  });
}

startButton.onclick = () => {
  startButton.disabled = true;
  run(proxyInput.value);
};
