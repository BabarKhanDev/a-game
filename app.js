const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
const app = express();
const path = require('path');
const { read } = require("fs");

// this allows us to receive json data from a post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// This allows users to access all files in the public directory
app.use(express.static(path.join(__dirname, 'public')));
// add router in express app
app.use("/",router);

// load prompts
var promptList = []
var fs = require('fs')
fs.readFile('prompts.txt', 'utf8', function(err, data) {
    if (err) throw err;
    promptList.push(data);
});
// loaded prompts

//START OF GAME VARIABLES
const ROUND_COUNT = 3;
var currentRound = 0;
var usernames = [];
var createdUserDict = {};
var gameState = 0;
var promptToUserMappings = []; //from prompts to users
var userToPromptMappings = []; //from users to prompts
var currentRoundPrompts = []; //these are the responses from users of the form [prompt, answer, username]
    //I will edit these for testing purposes
//var createdUserDict = {'::ffff:192.168.0.86': [ 'TEST 2', 'banana' ],'::ffff:192.168.0.179': [ 'TEST PHONE', 'orange' ]};
//var gameState = 1;
//var usernames = ['TEST 2','babar phone', 'rachel', 'furkan']
//END OF GAME VARIABLES


//START OF WEB PAGE ROUTES
router.get('/',(req, res) => {
    res.sendFile(path.join(__dirname,"public/index.html"));
});
router.get('/display',(req, res) => {
    res.sendFile(path.join(__dirname,"public/display/index.html"));
});
//END OF WEB PAGE ROUTES

//START OF NON WEB PAGE GETTING ROUTES
router.get('/checkIfIPExist', function requestHandler(req, res){
    if(createdUserDict[req.ip] != undefined ){
        res.end(createdUserDict[req.ip][0] + '/' + createdUserDict[req.ip][1])
    }
    else{
        res.end('false')
    }
});
router.get('/checkGameState', function requestHandler(req, res){
    res.end(String(gameState));
});
router.get('/getPrompt', function requestHandler(req, res){
    //need to set up the code to give users 2 prompts
    let username = createdUserDict[req.ip][0];
    let prompts = userToPromptMappings[currentRound][username]
    res.end( String(prompts));
})
//END OF NON WEB PAGE GETTING ROUTES

//START OF POSTING ROUTES  
router.post('/postPromptResponse', function requestHandler(req, res){
    currentRoundPrompts.push([req.body.promptAnswer1,req.body.promptAnswer2,req.body.username])
    console.log([req.body.promptAnswer1,req.body.promptAnswer2,req.body.username])
    res.end('true')
})

router.post('/startGame', async function requestHandler(req, res){
    gameState = 1;
    res.end('true');
    //create prompt to user mapping
    //load the list of all prompts
    shuffledPromptList = promptList[0].split('\r\n')
    shuffledPromptList.sort(() => (Math.random() > .5) ? 1 : -1);

    //select usernames.length * 3 of them.
    shuffledPromptList = shuffledPromptList.slice(0,usernames.length*ROUND_COUNT);

    roundedPrompts=[];
    for(let i = 0; i<ROUND_COUNT;i++){
        roundedPrompts.push(shuffledPromptList.slice(usernames.length*i, usernames.length*(i+1) ));
    };

    for(let round=0; round<roundedPrompts.length;round++){
        let promptUserMapping = {}
        let userPromptMapping = {}
        for(let promptID=0; promptID<usernames.length;promptID++){
            promptUserMapping[roundedPrompts[round][promptID]] = [usernames[promptID%usernames.length] , usernames[(promptID+1)%usernames.length]]
            if((Object.keys(userPromptMapping)).includes(usernames[(promptID+1)%usernames.length])){
                userPromptMapping[usernames[(promptID+1)%usernames.length]].push(roundedPrompts[round][promptID])
            }else{
                userPromptMapping[usernames[(promptID+1)%usernames.length]] = [roundedPrompts[round][promptID]]
            }
            if((Object.keys(userPromptMapping)).includes(usernames[promptID%usernames.length])){
                userPromptMapping[usernames[promptID%usernames.length]].push(roundedPrompts[round][promptID])
            }else{
                userPromptMapping[usernames[promptID%usernames.length]] = [roundedPrompts[round][promptID]]
            }

        }
        promptToUserMappings.push(promptUserMapping)
        userToPromptMappings.push(userPromptMapping)
        usernames.sort(() => (Math.random() > .5) ? 1 : -1); //this means that you wont always get paired up with the same players
    }

    console.log(userToPromptMappings)
    console.log(promptToUserMappings)
})

router.post('/getLoggedInUsers', function requestHandler(req,res){
    var output = [];
    keys = Object.keys(createdUserDict)
    for(var i = 0; i<keys.length; i++){
        output.push(createdUserDict[keys[i]]);
    }
    res.end(String(output));
})

router.post('/checkUsernameTaken', function requestHandler(req,res){res.end(String(usernames.includes(req.body.username)))})

router.post('/clearExistingUser', function requestHandler(req,res){
    usernames = usernames.filter(function(value,index,arr){return value!=req.body.username});
    createdUserDict[req.ip] = undefined;
    res.end('user cleared');
})

router.post('/postNewUser', function requestHandler(req, res) {
    createdUserDict[req.ip] = [req.body.username , req.body.image]  
    usernames.push(req.body.username)
    console.log(createdUserDict)
    res.end('true');
});

//END OF POSTING ROUTES

app.listen(3000,() => {
    console.log("Started on PORT 3000");
})