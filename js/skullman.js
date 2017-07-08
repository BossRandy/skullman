var lettersCapital = [];    //***Capital letters A-Z.
var lettersUsed = [];       //***Index from lettersCapital[] of choices.
var words = [];             //***Possible words for game.
var selectedWord = 0        //***Index from words[] randomly chosen.
var maxWrong = 6;           //***Max allowed wrong guesses.
var gameOver = false;       //***Set when win or loose.
var gameWin = false;        //***Set only when win guess correct.
var gameSolve = false;      //***Set when solve button used.
var gameWinCnt = 0;
var playerInitials = '';
var playerScoreKey = '';
var api = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun&minCorpusCount=8000&maxCorpusCount=-1&minDictionaryCount=3&maxDictionaryCount=-1';

$(document).ready(function () {

    $("#divSubmitScore").hide();

    // Initialize Firebase


});

//*****************
// FUNCTIONS
//*****************

function getNewWord() {

    //***Select a random preset word by default.
    selectedWord = Math.floor(Math.random() * (words.length - 1));

    //***Word API settings.
    var apitemp = api += '&api_key=c18a8a35d584402bef9000d09c50d274e2bdf7f22eff6c324';
    apitemp = apitemp += '&minLength=4';
    apitemp = apitemp += '&maxLength=8';

    //***Tray and get random word from API.
    $.when($.get(apitemp)).then(function(data) {

        //***Always put random word from API put in index 0.
        selectedWord = 0;
        words[selectedWord] = data.word;

        //***Build up number of tombstones.
        getNewWordTomb();

        //***An API failure will just build tombstones for the intial random word selected - pretty sweet code right here.
    }, getNewWordTomb);
}

function getNewWordTomb() {

    console.log("gameNew:selectedWord:value:" + selectedWord + " (" + words[selectedWord] + ")"); //***Debug logging.

    //***Place tombstone for each char in selected word.
    document.getElementById("divBuckets").innerHTML = "";
    for (let i = 0; i < words[selectedWord].length; i++) {
        document.getElementById("divBuckets").innerHTML += '<div id="divTombChar' + i + '" class="tombchar">_</div>'; //***STRANGE SHIFTING WITHOUT DASH CHAR AS DEFAULT
    }

    scoreUpdate();
    highUpdate();
}

function dialogBox(tl, msg, score) {

    window.setTimeout(function () {
        $("#divDialog").html(msg).dialog({
            title: tl,
            draggable: false,
            modal: true,
            width: 400,
            buttons: {
                Close: function () {
                    $(this).dialog("close");

                    if (score === true) {
                        if (playerInitials.length === 0)
                            dialogScore();
                        else
                            submitScore();
                    }
                }
            }
        });
    }, 1200);
}

function dialogScore() {

    $("#divSubmitScore").dialog({
        autoOpen: false,
        height: 235,
        width: 350,
        modal: true,
        buttons: {
            "Submit Score": submitScore,
        },
        close: function () {
            $("#divSubmitScore").find("form")[0].reset();
            $('#putInital').removeClass("ui-state-error");
        }
    }).dialog("open");

}

function uniqueChar(str1) {
    var str = str1;
    var uniql = "";

    for (let x = 0; x < str.length; x++) {
        if (uniql.indexOf(str.charAt(x)) == -1) {
            uniql += str[x];
        }
    }
    return uniql;
}

function GuessCnt(correct) {
    console.log("GuessCnt():value:" + correct); //***Debug logging.
    var result = 0;

    //***Loop index of guesses which holds the index of lettersCapital. Count correct or incorrct guesses.
    for (let i = 0; i < lettersUsed.length; i++) {
        let char = words[selectedWord].toUpperCase().indexOf(lettersCapital[lettersUsed[i]].toUpperCase())

        if ((correct === false && char === -1) || (correct === true && char >= 0))
            result++;
    }

    //***Prevent wrong count from going over max wrong possible (extra protection).
    if (correct === false && result > maxWrong)
        result = maxWrong;

    //***Set game over if wrong guesses equals max allowed wrong or correct guesses equals unique chars in selected word.
    if ((correct === false & result >= maxWrong) || (correct === true && result === uniqueChar(words[selectedWord]).length))
        gameOver = true;

    if (correct === true && result === uniqueChar(words[selectedWord]).length)
        gameWin = true;

    //***Show skull that equals wrong count and hide other images.
    for (let i = 0; i <= maxWrong; i++) {
        if (correct === false && i === result)
            $('#skull' + i).show();
        else
            $('#skull' + i).hide();
    }

    return result;
}

function scoreUpdate() {

    //***Scorebaord text.
    var temp = "";
    temp += "Word Length: " + words[selectedWord].length.toString() + "<br />";
    temp += "Guesses: " + lettersUsed.length.toString() + "<br />";
    temp += "Correct: " + GuessCnt(true).toString() + "<br />"; //***SETS GAMEOVER VAR!!!
    temp += "Wrong: " + GuessCnt(false).toString() + " of " + maxWrong.toString() + "<br />"; //***SETS GAMEOVER VAR!!!

    //***Update scoreboard DIV.
    $('#divScoreboard').html(temp);
}

function highUpdate() {

    var db = firebase.database();

    db.ref('score').orderByChild("gameswon").limitToLast(10).on('value', function (results) {
        //console.log(results);

        //***Hold the score IDs from database.
        var scoreIDs = [];
        var topScore = results.val();

        results.forEach(function(elm) {
            //console.log(elm.key);
            scoreIDs.push(elm.key);
        });

        scoreIDs.reverse();

        //***Clear the high score table and loop 10 times. (only show 10 top scores).
        $('#tableHighscore').html('');
        for (let i = 1; i <= 10; i++) {

            //***Default inital and score are dash. If loop # is less that scoresIDs then use database data.
            var theInital = '---';
            var theScore = '--';
            if (i <= scoreIDs.length) {
                theInital = topScore[scoreIDs[i - 1]].initials;
                theScore = topScore[scoreIDs[i - 1]].gameswon;
            }

            //***New table row.
            var $newTR = $('<tr>');

            //***Rank column.
            var $newTD = $('<td>').attr('width', '6px');
            $newTD.html('#' + i.toString());
            $newTR.append($newTD);

            //***Player inital column.
            var $newTD = $('<td>').attr('width', '75px');
            $newTD.html(theInital);
            $newTR.append($newTD);

            //***Player score column.
            var $newTD = $('<td>').attr('text-align', 'right');
            $newTD.html(theScore);
            $newTR.append($newTD);

            //***Append table row to table.
            $('#tableHighscore').append($newTR);
        }

    });
}

//***Code to run when a letter is selected. Used during solve puzzle too.
function letterSelect(id) {
    console.log("letterSelect():value:" + id); //***Debug logging.

    //***Do nothing if already used.
    if (lettersUsed.indexOf(id) !== -1)
        return;

    if (gameOver === true)
        return;

    //***Add id to used letters array.
    lettersUsed.push(id);

    //***Does letter exist in selectedWord. Default false.
    var existChar = "X";
    var existClass = "wrong";
    if (words[selectedWord].toUpperCase().indexOf(lettersCapital[id].toUpperCase()) > -1) {
        existChar = "L";
        existClass = "correct";

        //**Loop selected word and unhide matching letters.
        for (let i = 0; i < words[selectedWord].length; i++) {
            if (words[selectedWord].substring(i, i + 1).toUpperCase() === lettersCapital[id]) {
                //document.getElementById("divTombChar" + i).innerHTML = lettersCapital[id];
                var $tc = $('#divTombChar' + i).html(lettersCapital[id]);
            }
        }
    }

    //***Set X or Check on letter.
    $('#divMarked' + id).addClass(existClass);
    $('#divMarked' + id).html(existChar);

    //***SETS GAMEOVER VAR!!!
    scoreUpdate();

    //***Grey "Solve Button" and disable.
    if (gameOver === true) {
        $('#btnSolve').attr('disabled', 'disabled');
        $('#btnRestart').removeAttr('disabled');

        if (gameWin === true && gameSolve === false) {
            gameWinCnt++;
            dialogBox("You Won!", "That was some great guessing, but I think you just got lucky.<br><br>Click 'New Game' button to play again.", true);
        }
        else {
            gameWinCnt = 0;
            playerScoreKey = '';
            dialogBox("You Lost!", "The secret word was \"" + words[selectedWord].toUpperCase() + "\".<br><br>Click 'New Game' button to play again.");
        }
    }
}

//***Initilize variables for new game.
function gameInit() {
    console.log("gameInit()"); //***Debug logging.

    //***Loop ascii for capital A-Z.
    for (let i = 65; i <= 90; i++) {
        lettersCapital.push(String.fromCharCode(i));
        //console.log("gameInit:lettersCapital[]:value:" + lettersCapital[lettersCapital.length - 1]);
    }

    //***Add skull images.
    for (let i = 0; i <= maxWrong; i++) {
        //$("#divHangman").innerHTML += "<img id=\"skull" + i + "\" src=\"images/hangman0" + i + ".gif\" height=\"12%\" width=\"12%\" />";
        document.getElementById("divHangman").innerHTML += "<img id=\"skull" + i + "\" src=\"images/hangman0" + i + ".gif\" height=\"12%\" width=\"12%\" />";
    }

    //***Add Possible words.
    words.push("automobile");
    words.push("vacation");
    words.push("poptart");
    words.push("chocolate");
    words.push("rockstar");
    words.push("bandaid");
    words.push("javascript");
    words.push("bullfrog");
    words.push("zombie");
    words.push("smartphone");
    words.push("children");
    words.push("shotgun");
    words.push("university");
    words.push("california");
    words.push("uppercut");
    words.push("keyboard");
    words.push("tripod");
    words.push("suitcase");
    words.push("bubbles");

    gameNew();
}

//***Draw fresh UI.
function gameNew() {
    console.log("gameNew()"); //***Debug logging.
    lettersUsed = new Array;
    gameOver = false;
    gameWin = false;
    gameSolve = false;

    //***Display letters.
    document.getElementById("divCapitalLetters").innerHTML = "";
    lettersCapital.forEach(function (letter, idx) {
        //$('#divCapitalLetters').html();
        document.getElementById("divCapitalLetters").innerHTML += '<div class="answer"><div id="divMarked' + idx + '" class="marked"></div><kbd id="' + idx + '" class="light">' + letter + '</kbd></div>';
    });

    //***Pick random word.
    getNewWord();

    //***Disable/enable buttons.
    $('#btnSolve').removeAttr('disabled');
    $('#btnRestart').attr('disabled', 'disabled');

}

function submitScore() {

    if (playerInitials.length === 0)
        playerInitials = $('#putInital').val()

    if (checkLength(playerInitials, "Initials", 1, 3) === false) {
        playerInitials = '';
        $('#putInital').addClass("ui-state-error");
        return;
    }
        
    playerInitials = playerInitials.substring(0, 3).toUpperCase();

    //*********
    // Setup database update of score
    //*********

    //***Databbase reference.
    var db = firebase.database();

    if (playerScoreKey.length === 0)
        playerScoreKey = db.ref().child('score').push().key;

    //***Data to post.
    var postData = {
        initials: playerInitials,
        gameswon: gameWinCnt.toString()
    };

    var updates = {};
    updates['/score/' + playerScoreKey] = postData;
    db.ref().update(updates);

    //***Close the initals dialog.
    $("#divSubmitScore").dialog("close");
}

//***Used to pad a string. usage padding(<string to pad>, <total_string_size>, <pad with string - default 0>)
function padding(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

//***Return True if string within min/max
function checkLength(o, n, min, max) {

    var result = false;

    if (o.length > max || o.length < min)
        //***Show error.
        scoreError("Length of " + n + " must be between " + min + " and " + max + ".");
    else
        result = true;

    return result;
}

function scoreError(err) {
    $(".validateTips").text(err).addClass("ui-state-highlight");

    setTimeout(function () {
        $(".validateTips").removeClass("ui-state-highlight", 1500);
    }, 500);
}

//*****************
// EVENTS
//*****************

//***Model form submit to firebase.
$("#divSubmitScore").find("form").on("submit", function (event) {
    event.preventDefault();

    submitScore();
});

//***Keys clicked event.
$(document).on('click', '.light', function () {
    var id = $(this).attr('id'); //this.id;
    console.log(".light:click:value:" + id);
    //console.log(words[selectedWord]);
    //console.log(lettersCapital[id]);

    letterSelect(id);
});

//***Build a new game.
$('#btnRestart').click(function () {
    console.log("btnRestart"); //***Debug logging.

    //***Clear X's and Checks.
    //***Reset hangman graphic.
    //***Reset Stats
    //***Pick random word index.
    //***Setup number buckets for each char in word.
    gameNew();
});

//***Solve current game.
$('#btnSolve').click(function () {
    console.log("btnSolve"); //***Debug logging.

    gameSolve = true;

    //***Loop though selected word and add selected char to guesses if not already guessed.
    for (let i = 0; i < words[selectedWord].length; i++) {

        //***Basically act like clicking all the correct letters in selected hiddem word - Little hard to read.
        letterSelect(lettersCapital.indexOf(words[selectedWord].substring(i, i + 1).toUpperCase()).toString());
    }

});

//***Show inital welcome box.
dialogBox("Welcome", "Thanks for playing.<br><br>Click the letters to guess the secret word. You only have " + maxWrong + " chances.");

//***START HERE!!!
gameInit();