var inquirer = require('inquirer');
var reddit = require('./library/reddit');
var imageToAscii = require('image-to-ascii');

//take a post from Reddit API, return only certain information
//this info will be used to populate a selection menu of posts
//full.name will be selectable strings
//when selected, shown will be full.value
function redditTransform(array) {
    return array.map(function(post) {
        var full = {};
        var content = {};
        full.name = post.data['title'];
        content.url = post.data['thumbnail'];
        content.votes = post.data['score'];
        content.username = post.data['author'];
        content.permalink = post.data['permalink'];
        full.value = content;
        return full;
    });
}

//take a thumbnail url. if it exists, convert it to ASCII image
function urlToImg(obj, callback) {
    if (obj.url && obj.url !== 'self') {
        imageToAscii(obj.url, {
            bg: true,
            size: {
                height: "50%",
                width: "50%"
            }
        }, function(err, converted) {
            obj.conv = converted;
            callback(obj);
        });
    }
    else {
        obj.conv = [];
        callback(obj);
    }
}

//transform list of all subreddits into an array of titles and parameters
function allSubredditsTransform(array) {
    return array.map(function(post) {
        var select = {};
        select.title = post.data['title'];
        select.parameter = post.data['display_name'];
        return select;
    });
}

//main menu
var menuChoices = [{
    name: 'Show homepage',
    value: 'HOMEPAGE'
}, {
    name: 'Show subreddit',
    value: 'SUBREDDIT'
}, {
    name: 'List subreddits',
    value: 'SUBREDDITS'
}, {
    name: 'Quit',
    value: 'QUIT'
}];

//main app function
function app() {

    //'page' is an array of all posts data for certain parameters
    function pickAPost(page) {
        //converts array to an array of useful information
        var postChoices = redditTransform(page);
        //convert post titles to selectable menu items
        //prompt user to pick one
        inquirer.prompt({
            type: 'list',
            name: 'postMenu',
            message: 'Which post do you want to look at?',
            choices: postChoices,
        }).then(function(postChoice) {
            var copyPostChoice = Object.assign({}, postChoice.postMenu);
            //log user, votes, url
            console.log(copyPostChoice);
            urlToImg(postChoice.postMenu, function(result) {
                //log converted ASCII thumbnail
                console.log(result.conv);
                reddit.getComments(copyPostChoice['permalink'], function(comments) {
                    //log nested comments
                    console.log(comments)
                    //back to main menu
                    app();
                });
            });
        });
    }

    //if user wants to sort either homepage or subreddits, prompt for parameter
    function ifWantToSort(callback) {
        inquirer.prompt({
            type: 'input',
            name: 'sortSub',
            message: 'Enter a sorting parameter'
        }).then(function(sortSub) {
            callback(sortSub.sortSub);
        })
    }

    //user will be able to either prompt for a subreddit directly from the main menu or after viewing a list of all subreddits
    //therefore put the subRedditPrompt in a seperate function
    function subRedditPrompt() {
        inquirer.prompt({
            type: 'input',
            name: 'userSubRed',
            message: 'Enter a subreddit'
        }).then(function(userSubRed) {
            return userSubRed.userSubRed;
        }).then(function(subRed) {
            //ask if user then wants to sort this subreddit
            inquirer.prompt({
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to sort the subreddit?'
            }).then(function(answers) {
                return answers.confirm;
            }).then(function(res) {
                //is YES then prompt for sort parameter
                if (res) {
                    ifWantToSort(function(userSort){
                        //display sorted subreddit
                        reddit.getSortedSubreddits(subRed, userSort, function(page) {
                            //if parameters dont exist, return error message
                            if (typeof page === 'string') {
                                console.log(page);
                                app();
                            }
                            else {
                                //transform array to array of useful info
                                //display them in a menu with titles and selectable choices
                                pickAPost(page);
                            }
                        });

                    });
                }
                else {
                    //if NO then display subreddit
                    reddit.getSubreddit(subRed, function(page) {
                        if (typeof page === 'string') {
                            console.log(page);
                            app();
                        }
                        else {
                            pickAPost(page);
                        }
                    });
                }
            });
        });
    }

    //original prompt: display homepage, specific subreddit, or subreddits
    inquirer.prompt({
        type: 'list',
        name: 'menu',
        message: 'What do you want to do?',
        choices: menuChoices
    }).then(function(answers) {
        //if user wants homepage
        if (answers.menu === "HOMEPAGE") {
            //ask if user wants to sort homepage Y/n
            inquirer.prompt({
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to sort the homepage?'
            }).then(function(answers) {
                return answers.confirm;
            }).then(function(res) {
                //if user DOES want to sort
                if (res) {
                    //call function which prompts user for search parameter
                    ifWantToSort(function(sortParameter) {
                        //display sorted homepage
                        reddit.getSortedHomepage(sortParameter, function(page) {
                            //if parameter does not exist, print error message
                            if (typeof page === 'string') {
                                console.log(page);
                                //back to main menu
                                app();
                            }
                            else {
                                //call function which displays posts
                                pickAPost(page);
                            }
                        });
                    });
                }
                else {
                    //if user DOES NOT want to sort, get homepage posts
                    reddit.getHomepage(function(page) {
                            //call function which displays posts
                            pickAPost(page);
                    });
                }
            });
        }
        //if user wants a specific subreddit
        else if (answers.menu === "SUBREDDIT") {
            //prompt for which subreddit
            subRedditPrompt();
        }
        //if user wants to see all subreddit options
        else if (answers.menu === 'SUBREDDITS') {
            //display subreddits
            reddit.getSubreddits(function(page) {
                console.log(allSubredditsTransform(page));
                //ask user if they want to enter one or go back to main menu
                inquirer.prompt({
                    type: 'list',
                    name: 'subredditsMenu',
                    message: 'What do you want to do?',
                    choices: [
                        'Enter a subreddit parameter',
                        new inquirer.Separator(),
                        'Return to main menu'
                    ]
                }).then(function(answer) {
                    if (answer.subredditsMenu === 'Return to main menu') {
                        app();
                    }
                    else {
                        //if they want to pick a subreddit, prompt for which one
                        subRedditPrompt();
                    }
                });
            });
        }
        //exit app
        else if (answers.menu === 'QUIT') {
            console.log("Bye bye!");
            return;
        }
    });
}

app();