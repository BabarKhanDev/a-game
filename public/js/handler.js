var currentSel = null;
var username = '';
var lastSeenState = -1
const timer = ms => new Promise(res => setTimeout(res, ms))

async function gameLoop(){
    await timer(100);
    while(true){
        determinePageState();
        await timer(500);
    }
}

//This is the code for determining which page to build
async function determinePageState(){

    let gameState = await getGameState();
    if(gameState == lastSeenState){
        return;
    }   

    lastSeenState = gameState;
    hideAllSections()
    let existingIp = await checkIfIPExist(); 

    if((existingIp == 'false') && (gameState != 0) ){
        alert('sorry the game has already started!')
    }

    switch (gameState){
        case 0: //this is the user login page
            if(existingIp == 'false'){
                //if the user doesn't already exist then generate the page that will allow them to create a username
                buildLoginPage();
            }
            else{
                //if the user does exist then redirect them to the waiting area
                username = existingIp.split('/')[0];
                currentSel = existingIp.split('/')[1];
                generateUserDisplay();
            };
            break;
        case 1: //this is the user prompt page          
            generatePromptInputDisplay();
            break;
        case 2: //this is the user voting page
            //generatepromptVoteDisplay();
            break;
    }
}

//START OF CODE FOR GENERAL PURPOSE FUNCTIONS
async function getGameState(){
    let response = await fetch("http://192.168.0.86:3000/checkGameState");
    return Number(await response.text());
}
async function checkIfIPExist(){
    let response = await fetch("http://192.168.0.86:3000/checkIfIPExist");
    return await response.text();
}
function showSection(sectionID){
    document.getElementById(sectionID).setAttribute('style','display:flex');
}
function hideAllSections(){
    sections = document.getElementsByClassName('pageSection');
    for(let i = 0; i<sections.length;i++){
        sections[i].setAttribute('style','display:none');
    }
}
function startGame(){
    fetch("http://192.168.0.86:3000/startGame", {method:'POST'});
}
//END OF CODE FOR GENERAL PURPOSE FUNCTIONS

//**START OF CODE FOR PROMPT PAGE**
async function generatePromptInputDisplay(){
    showSection('promptPage')    //show the prompt section

    //get the prompt from the server
    let response = await fetch("http://192.168.0.86:3000/getPrompt");
    let prompt = await response.text()
    console.log(prompt)
    prompt = prompt.split(',');

    //display the prompt on the screen
    document.getElementById('prompt').innerHTML = prompt[0][0].toUpperCase() + prompt[0].slice(1)
    document.getElementById('prompt').setAttribute('nextPrompt',prompt[1][0].toUpperCase() + prompt[1].slice(1) )

}

async function submitPrompt(){
    //is this the first time they pressed it?
    let nextPrompt = document.getElementById('prompt').getAttribute('nextPrompt');
    if(nextPrompt != -1){
        //they still have to enter the answer for the second prompt
        document.getElementById('promptAnswer').setAttribute('firstAnswer',document.getElementById('promptAnswer').value);
        document.getElementById('prompt').innerHTML = document.getElementById('prompt').getAttribute('nextprompt');
        document.getElementById('promptAnswer').value = '';
        document.getElementById('prompt').setAttribute('nextPrompt',-1);
    }
    else{
        //handle the users output
        let response = await fetch("http://192.168.0.86:3000/postPromptResponse", {
            method:'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({promptAnswer1: document.getElementById('promptAnswer').getAttribute('firstAnswer'),promptAnswer2: document.getElementById('promptAnswer').value, username:username})

        })
    }

    //send the user to a waiting area
}
//**END OF CODE FOR PROMPT PAGE**

//**START OF CODE FOR LOGIN PAGE**
function generateUserDisplay(){
    document.getElementById('carousel').parentNode.removeChild(document.getElementById('carousel'));
    document.getElementById('dots').parentNode.removeChild(document.getElementById('dots'));
    document.getElementById('submitPP').parentNode.removeChild(document.getElementById('submitPP'));
    document.getElementById('username').parentNode.removeChild(document.getElementById('username'));
    document.getElementById('submitUsername').parentNode.removeChild(document.getElementById('submitUsername'));
    
    document.getElementById('title').innerHTML = 'Welcome ' + username;
    document.getElementById('waiting').innerHTML = 'Waiting For Game To Start';

    document.getElementById('submitNewUser').hidden = false;
}
function buildLoginPage(){
    showSection('loginPage')
    document.getElementById('title').innerHTML = 'Choose A Username'
}
function generatePPSel(){
    showSection('loginPage')
    document.getElementById('usernameLabel').hidden = true
    document.getElementById('username').hidden = true
    document.getElementById('submitUsername').hidden = true
    document.getElementById('carousel').hidden = false
    document.getElementById('dots').hidden = false
    document.getElementById('title').innerHTML = 'Choose A Profile Picture'

    let imageList = getImages();
    for(var i = 0; i<imageList.length; i++){
        document.getElementById('carousel').appendChild(genImage(imageList[i]));
    }
    generateDots(imageList.length);
    addDotEventListeners();submitUserData
}
function getImages(){
    return ['images/banana.jpg', 'images/apple.png', 'images/grapes.jpg','images/kiwi.jpg','images/orange.jpg','images/peach.jpg','images/pineapple.jpg']
}
function genImage(src){
    let image = document.createElement('img')
    image.setAttribute('src',src)
    image.setAttribute('class','imageSelection')
    image.setAttribute('onclick', 'changeSelection("'+src.slice(7,-4)+'")')
    return image
}
function changeSelection(img_name){
    currentSel = img_name;
    img_name = img_name[0].toUpperCase() + img_name.slice(1);
    document.getElementById('submitPP').hidden = false;
    document.getElementById('submitPP').innerHTML = 'Submit: ' + img_name;

}
function generateDots(count){
    dotContainer = document.getElementById('dots')
    for(var i = 0; i<count; i++){
        dot = document.createElement('button')
        dot.setAttribute('class','dot')
        dotContainer.appendChild(dot)
    }
}
function addDotEventListeners(){
    const dots = document.getElementById('dots');
    dots.addEventListener('click', e => {
      const target = e.target;
      if (!target.matches('.dot')) {
          return;
      }
      
      const index = Array.from(dots.children).indexOf(target);
      const selector = `.imageSelection:nth-child(${index + 1})`;
      const box = document.querySelector(selector)

      changeSelection(box.src.split('/')[4].slice(0,-4))
      box.scrollIntoView({
        behavior: 'smooth',
        inline: 'start'
      })
    })
}
//LOGIN PAGE BUTTON HANDLERS
async function clearSavedUser(){

    let response = await fetch("http://192.168.0.86:3000/clearExistingUser", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username:username})
    })

    let data = await response.text();
    if(data == 'user cleared'){
        location.reload();
    }
    else{
        alert('An error has occured')
    }

}
async function submitUserData(){

    let response = await fetch("http://192.168.0.86:3000/postNewUser", {
        method:'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({image:currentSel, username:username})
    })

    data = await response.text();
    if(data == 'true'){
        generateUserDisplay();
    }
    else{
        alert('something went wrong')
    }

}
async function submitUsername(){
    let usernameChoice = document.getElementById('username').value.toUpperCase();
    if(usernameChoice.length==0){
        alert('username cannot be blank');
        return;
    }
    if(usernameChoice.match(/[a-z0-9A-Z ]*/)[0] != usernameChoice){
        alert('username can only contain letters and numbers');
        return;
    }
    if(await checkUsernameTaken(usernameChoice)){
        alert('username taken');
        return;
    }
    username = usernameChoice;
    generatePPSel();
}
async function checkUsernameTaken(usernameChoice){
    let response = await fetch("http://192.168.0.86:3000/checkUsernameTaken", {
        method:'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username: usernameChoice})
    })
    let data = await response.text();
    console.log(data)
    return (data == 'true')
}
//**END OF CODE FOR LOGIN PAGE**