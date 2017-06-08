var lettersCapital = [];    //***Capital letters A-Z.
var lettersUsed = [];       //***Index from lettersCapital[] of choices.
var words = [];             //***Possible words for game.
var selectedWord = 0        //***Index from words[] randomly chosen.
var maxWrong = 6;           //***Max allowed wrong guesses.
var gameOver = false;       //***Set when win or loose.
var gameWin = false;        //***Set only when win guess correct.
var gameSolve = false;      //***Set when solve button used.
var api = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=noun&minCorpusCount=8000&maxCorpusCount=-1&minDictionaryCount=3&maxDictionaryCount=-1&minLength=4&maxLength=8&api_key=[API_KEY]';


//*****************
// FUNCTIONS
//*****************

function getNewWord() {
    
    selectedWord = Math.floor(Math.random() * (words.length - 1));

    $.when($.get(api)).then(function(data) {

        //***Random word from API put in index 0.
        selectedWord = 0;
        words[selectedWord] = data.word;
        
        getNewWordTomb();

    }, getNewWordTomb);
}

function getNewWordTomb() {

    console.log("gameNew:selectedWord:value:" + selectedWord + " (" + words[selectedWord] + ")");

    //***Place tombstone for each char in selected word.
    document.getElementById("divBuckets").innerHTML = "";
    for (let i = 0; i < words[selectedWord].length; i++) {
        document.getElementById("divBuckets").innerHTML += '<div id="divTombChar' + i + '" class="tombchar">_</div>'; //***STRANGE SHIFTING WITHOUT DASH CHAR AS DEFAULT
    }

    scoreUpdate();
}

function dialogBox(tl, msg) {

    window.setTimeout(function () {
        $("#divDialog").html(msg).dialog({
            title: tl,
            draggable: false,
            modal: true,
            width: 400,
            buttons: {
                Close: function () {
                    $(this).dialog("close");
                }
            }
        });
    }, 1200);
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
    console.log("GuessCnt():value:" + correct);
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

    //***Scorebaord.
    var scoretext = "";
    scoretext += "Word Length: " + words[selectedWord].length.toString() + "<br />";
    scoretext += "Guesses: " + lettersUsed.length.toString() + "<br />";
    scoretext += "Correct: " + GuessCnt(true).toString() + "<br />"; //***SETS GAMEOVER VAR!!!
    scoretext += "Wrong: " + GuessCnt(false).toString() + " of " + maxWrong.toString() + "<br />"; //***SETS GAMEOVER VAR!!!

    //document.getElementById("divScoreboard").innerHTML = scoretext;
    $('#divScoreboard').html(scoretext);
}

function letterSelect(id) {
    console.log("letterSelect():value:" + id);

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

        if (gameWin === true && gameSolve === false)
            dialogBox("You Won!", "That was some great guessing, but I think you just got lucky.<br><br>Click 'New Game' button to play again.");
        else
            dialogBox("You Lost!", "The secret word was \"" + words[selectedWord].toUpperCase() + "\".<br><br>Click 'New Game' button to play again.");
    }
}

//***Initilize variables for new game.
function gameInit() {
    console.log("gameInit()");

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
    words.push("chololate");
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
    console.log("gameNew()");
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
    /*
    selectedWord = Math.floor(Math.random() * (words.length - 1));
    console.log("gameNew:selectedWord:value:" + selectedWord + " (" + words[selectedWord] + ")");

    //***Place tombstone for each char in selected word.
    document.getElementById("divBuckets").innerHTML = "";
    for (let i = 0; i < words[selectedWord].length; i++) {
        document.getElementById("divBuckets").innerHTML += '<div id="divTombChar' + i + '" class="tombchar">_</div>'; //***STRANGE SHIFTING WITHOUT DASH CHAR AS DEFAULT
    }

    scoreUpdate();
    */

    //***Disable/enable buttons.
    $('#btnSolve').removeAttr('disabled');
    $('#btnRestart').attr('disabled', 'disabled');

}

//*****************
// EVENTS
//*****************
$(document).on('click', '.light', function () {
    var id = $(this).attr('id'); //this.id;
    console.log(".light:click:value:" + id);
    //console.log(words[selectedWord]);
    //console.log(lettersCapital[id]);

    letterSelect(id);
});

$('#btnRestart').click(function () {
    console.log("btnRestart");

    //***Clear X's and Checks.
    //***Reset hangman graphic.
    //***Reset Stats
    //***Pick random word index.
    //***Setup number buckets for each char in word.
    gameNew();
});

$('#btnSolve').click(function () {
    console.log("btnSolve");

    gameSolve = true;

    //***Loop though selected word and add selected char to guesses if not already guessed.
    //console.log(lettersUsed);
    for (let i = 0; i < words[selectedWord].length; i++) {
        //var letter1 = words[selectedWord].substring(i, i + 1).toUpperCase();
        //console.log("Selected Word Letter: " + letter1);

        //var letter2 = lettersCapital.indexOf(letter1);
        //console.log("Index of Letter: " + letter2);

        //var letter3 = lettersUsed.indexOf(letter2.toString());
        //console.log("Index of Used: " + letter3);

        letterSelect(lettersCapital.indexOf(words[selectedWord].substring(i, i + 1).toUpperCase()).toString());
    }

});



dialogBox("Welcome", "Thanks for playing.<br><br>Click the letters to guess the secret word. You only have " + maxWrong + " chances.");
gameInit();