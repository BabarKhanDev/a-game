console.log('displayHandler Loaded')
const timer = ms => new Promise(res => setTimeout(res, ms))

async function gameLoop(){
    await timer(100);
    while (true){

        //ask the server what the state of the game is
        //depending on state build a specific page.
        displayPageLoggedInUsers()

        await timer(500);
    }
}

async function displayPageLoggedInUsers() { // We need to wrap the loop into an async function for this to work
    
    //unhide the section for logged in users
    document.getElementById('loggedInPageSection').hidden = false;

    //find out which users are logged in
    let response = await fetch("http://192.168.0.86:3000/getLoggedInUsers", {method: 'POST'});
    let userList = await response.text();

    userList = userList.split(',');

    createUserElement = function(username, image){
        userElem = document.createElement('div');
        if('aeiou'.indexOf(image[0]) > -1){
            userElem.innerHTML = username + " is an " + image;
        }
        else{
            userElem.innerHTML = username + " is a " + image;
        }

        return userElem;
    }

    displayPageUserList = document.getElementById('userList');
    displayPageUserList.innerHTML = '';

    for(var i = 0; i<userList.length; i+=2){
        displayPageUserList.appendChild(createUserElement(userList[i],userList[i+1]));
    }

}