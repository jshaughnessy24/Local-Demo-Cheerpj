// renderers/home.js

addEventListener('load',async  () =>{
    const profile = await window.electronAPI.getProfile();
    //document.getElementById('picture').src = profile.picture;
    //document.getElementById('name').innerText = profile.name;
    //document.getElementById('success').innerText = 'You successfully used OpenID Connect and OAuth 2.0 to authenticate.';
  });

  //for communicating with unity IFRAME
  window.onmessage = function(e) {
    console.log("messagesent");
    if (e.data == 'unity') {
        alert('It works!');
    }
};

async function getLeader()
{
    var output = await window.electronAPI.getLeaderboard();
    var frame = document.getElementById('fieldViewiframe');
    console.log(frame);
    frame.contentWindow.postMessage(JSON.stringify(output),'*');
}

window.top.onmessage = function(e) {
    console.log("messageseddnt");

    if (e.data.action && e.data.action == 'getleader')
    {   
        getLeader();
    }
    else if (e.data) {
        sendLeaderData(e.data);
    }
};

async function sendLeaderData(data)
{
    var profile = await window.electronAPI.getProfile();
    if(!profile)
    {
        console.log('not logged in, not sending data');
        return null;
    }
    var inputData = {points: data.points, game:data.game, uid:profile.sub, name:profile.name};
    var output = await window.electronAPI.setLeaderboard(inputData);
}
  /*document.getElementById('setscore').onclick = async () => {
    
  };*/

