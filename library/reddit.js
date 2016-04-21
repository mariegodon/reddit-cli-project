var request = require("request");
var util = require("util");
var wordWrap = require("word-wrap");

var redditURL = "https://www.reddit.com/";

function getHomepage(callback) {
    var homePageURL = "https://www.reddit.com/.json";
    request(homePageURL, function(err, homePageJSON) {
        var homePage = JSON.parse(homePageJSON.body).data.children;
        callback(homePage);
    });
}

function getSortedHomepage(sortingMethod, callback) {
    request(redditURL + sortingMethod + ".json", function(err, sortedPageJSON) {
        if (JSON.parse(sortedPageJSON.body).error) {
            callback("Uh oh! Not a valid sorting parameter!");
        }
        else {
            var sortedPage = JSON.parse(sortedPageJSON.body).data.children;
            callback(sortedPage);
        }
    });
}

function getSubreddit(subreddit, callback) {
    request(redditURL + "/r/" + subreddit + ".json", function(err, subJSON) {
        if (!JSON.parse(subJSON.body).data.children[0]) {
            callback("Oh no! Subreddit does not exist!");
        }
        else {
            var sub = JSON.parse(subJSON.body).data.children;
            callback(sub);
        }
    });
}

function getSortedSubreddits(subreddit, sortingMethod, callback) {
    request(redditURL + "/r/" + subreddit + "/" + sortingMethod + ".json", function(err, subSortJSON) {
        if (!JSON.parse(subSortJSON.body).data.children[0]) {
            callback("Hmm.. try some different search parameters!");
        }
        else {
            var subSort = JSON.parse(subSortJSON.body).data.children;
            callback(subSort);
        }
    });
}

function getSubreddits(callback) {
    request(redditURL + "/subreddits.json", function(err, subJSON) {
        var sub = JSON.parse(subJSON.body).data.children;
        callback(sub);
    });
}

function getComments(permaLink, callback) {
    var comments = [];
    request(redditURL + permaLink + ".json", function(err, postCommentsJSON) {
        var postCommentsArr = (JSON.parse(postCommentsJSON.body))[1].data.children;
        var i = 0;
        while (i < postCommentsArr.length) {
            var j = 0;
            if (postCommentsArr[i].data.body){
            comments.push(postCommentsArr[i].data.body);
            }
            if (postCommentsArr[i].data.replies){
                while (j < postCommentsArr[i].data.replies.data.children.length){
                    if (postCommentsArr[i].data.replies.data.children[j].data.body){
                    comments.push(wordWrap(postCommentsArr[i].data.replies.data.children[j].data.body, {indent: '   '}));
                    }
                    j++
                }
            }
            i++
        }
        callback(comments);
    });
}

module.exports = {
    getHomepage: getHomepage,
    getSortedHomepage: getSortedHomepage,
    getSubreddit: getSubreddit,
    getSortedSubreddits: getSortedSubreddits,
    getSubreddits: getSubreddits,
    getComments: getComments
}
