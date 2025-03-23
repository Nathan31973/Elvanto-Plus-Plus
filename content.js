console.log("Evanto Live ++ By Nathan3197");
console.log("Current URL:", window.location.href);
if (window.location.href.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
    console.log("Elvanto live page matched!");
} else {
    console.log("Not matching Elvanto live page.");
}
