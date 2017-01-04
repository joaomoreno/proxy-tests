// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');
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

function runNode(requestUrl, rejectUnauthorized = true) {
  return new Promise(resolve => {
    const endpoint = url.parse(requestUrl);
    const rawRequest = endpoint.protocol === 'https:' ? https.request : http.request;
    const opts = {
      hostname: endpoint.hostname,
      port: endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80),
      path: endpoint.path,
      method: 'GET',
      rejectUnauthorized
      // agent: options.agent,
    };

    req = rawRequest(opts, res => {
      let buffer = [];
      res.on('data', d => buffer.push(d));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          result: hash(buffer.join(''))
        });
      });
      res.on('error', (err) => {
        console.log(err);

        resolve({
          status: 0,
          result: 'Error'
        });
      });
    });

    req.on('error', err => {
      console.log(err);

      resolve({
        status: 0,
        result: 'Error'
      });
    });
    req.end();
  });
}

function run(proxyUrl) {
  resultsElement.textContent = 'Running tests...';

  const tests = [
    ['HTTP XHR', runXHR(httpUrl)],
    ['HTTPS XHR', runXHR(httpsUrl)],
    ['HTTP Node', runNode(httpUrl)],
    ['HTTPS Node', runNode(httpsUrl)],
    ['HTTP Node (not strict)', runNode(httpUrl, false)],
    ['HTTPS Node (not strict)', runNode(httpsUrl, false)]
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
