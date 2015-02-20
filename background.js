var domainsOnHeroku = {}; // { 'www.example.com': false, … }
var rxDomain        = /^\w+:\/\/(.*?)\//;
var rxViaHeroku     = /vegur$/

function domainFromURL(url) {
  var domain = url.match(rxDomain);
  if (domain === null) return;
  return domain[1];
}

chrome.webRequest.onHeadersReceived.addListener(function(details) {
  var domain = domainFromURL(details.url);
  if (domainsOnHeroku.hasOwnProperty(domain)) return;
  var headers = details.responseHeaders;
  if (!headers) return;
  var via = headers.filter(function(header) { return header.name.toLowerCase() == 'via' })[0];
  domainsOnHeroku[domain] = !!(via && rxViaHeroku.test(via.value));
},
{ urls:["http://*/*", "https://*/*"] }, ["responseHeaders"]);

function updateOnHerokuFlagForTab(tab) {
  var domain   = domainFromURL(tab.url);
  var onHeroku = domainsOnHeroku[domain];
  var action   = { true:"show", false:"hide" }[!!onHeroku];
  chrome.pageAction[action](tab.id);
}

chrome.tabs.onActivated.addListener(function(info) {
  chrome.tabs.get(info.tabId, function(tab) {
    updateOnHerokuFlagForTab(tab) })});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  updateOnHerokuFlagForTab(tab) });

// Ensure the current selected tab is set up.
chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
  updateOnHerokuFlagForTab(tabs[0]) });
