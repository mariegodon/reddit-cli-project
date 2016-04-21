var inquirer = require('inquirer');
var reddit = require('./library/reddit');
var imageToAscii = require('image-to-ascii');

//take a post from Reddit API, return only certain information
//this information will be used to populate a selection menu of posts
//shown will be full.name
//when selected, shown will be full.value
function redditTransform(array) {
    return array.map(function(post) {
        var full = {};
        var content = {};
        full.name = post.data['title'];
        content.url = post.data['thumbnail'];
        content.votes = post.data['score'];
        content.username = post.data['author'];
        full.value = content;
        return full;
    });
}

//take a thumbnail url. if it exists, convert it to ASCII image
function urlToImg(obj, callback) {
    if (obj.url) {
        imageToAscii(obj.url, {
            bg: true,
            size: {height: "50%", width: "50%"}
        }, function(err, converted) {
            obj.conv = converted;
            //console.log(obj.url);
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
                    inquirer.prompt({
                        type: 'input',
                        name: 'sortSub',
                        message: 'Enter a sorting parameter'
                    }).then(function(sortSub) {
                        return sortSub.sortSub;
                    }).then(function(userSort) {
                        //display sorted subreddit
                        reddit.getSortedSubreddits(subRed, userSort, function(page) {
                            //if the function returns a string not an array, ERROR
                            if (typeof page === 'string') {
                                //display the error, restart app
                                console.log(page);
                                app();
                            }
                            else {
                                //transform array to array of useful info
                                //display them in a menu with titles and selectable choices
                                var postChoices = redditTransform(page);
                                inquirer.prompt({
                                    type: 'list',
                                    name: 'postMenu',
                                    message: 'Which post do you want to look at?',
                                    choices: postChoices,
                                }).then(function(postChoice) {
                                    //display information related to selected post
                                    console.log(postChoice.postMenu);
                                    //convert thumbnail url to img, display and restart app
                                    urlToImg(postChoice.postMenu, function(result) {
                                        console.log(result.conv);
                                        app();
                                    })
                                })
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
                            var postChoices = redditTransform(page);
                            inquirer.prompt({
                                type: 'list',
                                name: 'postMenu',
                                message: 'Which post do you want to look at?',
                                choices: postChoices,
                            }).then(function(postChoice) {
                                console.log(postChoice.postMenu);
                                urlToImg(postChoice.postMenu, function(result) {
                                    console.log(result.conv);
                                    app();
                                })
                            });
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
            //ask if user wants to sort homepage
            inquirer.prompt({
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to sort the homepage?'
            }).then(function(answers) {
                return answers.confirm;
            }).then(function(res) {
                //if user DOES want to sort home page, prompt for parameter
                if (res) {
                    inquirer.prompt({
                        type: 'input',
                        name: 'sortHome',
                        message: 'Enter a sorting parameter'
                    }).then(function(userAnswer) {
                        return userAnswer.sortHome;
                    }).then(function(sortParameter) {
                        //display sorted homepage
                        reddit.getSortedHomepage(sortParameter, function(page) {
                            if (typeof page === 'string') {
                                console.log(page);
                                app();
                            }
                            else {
                                var postChoices = redditTransform(page);
                                inquirer.prompt({
                                    type: 'list',
                                    name: 'postMenu',
                                    message: 'Which post do you want to look at?',
                                    choices: postChoices,
                                }).then(function(postChoice) {
                                    console.log(postChoice.postMenu);
                                    urlToImg(postChoice.postMenu, function(result) {
                                        console.log(result.conv);
                                        app();
                                    })
                                });
                            }
                        });
                    });
                }
                else {
                    //if user DOES NOT want to sort, show homepage
                    reddit.getHomepage(function(page) {
                        if (typeof page === 'string') {
                            console.log(page);
                            app();
                        }
                        else {
                            var postChoices = redditTransform(page);
                            inquirer.prompt({
                                type: 'list',
                                name: 'postMenu',
                                message: 'Which post do you want to look at?',
                                choices: postChoices,
                            }).then(function(postChoice) {
                                console.log(postChoice.postMenu);
                                urlToImg(postChoice.postMenu, function(result) {
                                    console.log(result.conv);
                                    app();
                                })
                            });
                        }
                    });
                }
            });
        }
        //if user wants a specific subreddit
        else if (answers.menu === "SUBREDDIT") {
            //prompt for which subreddit
            subRedditPrompt();

        }
        //if user wants all subreddit
        else if (answers.menu === 'SUBREDDITS') {
            //display subreddits
            reddit.getSubreddits(function(page) {
                console.log(allSubredditsTransform(page));
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
                        subRedditPrompt();
                    }
                })
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