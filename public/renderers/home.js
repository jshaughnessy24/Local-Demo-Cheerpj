// renderers/home.js

    addEventListener('load',async  () =>{
    const profile = await window.electronAPI.getProfile();
    //document.getElementById('picture').src = profile.picture;
    if(profile)
    {
        document.getElementById('name').innerText = profile.name;
        document.getElementById('logout').onclick = () => {
          window.electronAPI.logOut();
        };
    }
    else
    {
      document.getElementById('name').innerText = "Log in to post your high score";
      document.getElementById('logout').innerText = "Log In";
      document.getElementById('logout').onclick = () => {
        window.electronAPI.logIn();
      };
    }

    
    
    //document.getElementById('success').innerText = 'You successfully used OpenID Connect and OAuth 2.0 to authenticate.';
  });
  

  
  /*document.getElementById('secured-request').onclick = async () => {
    try {
      const response = await window.electronAPI.getPrivateData();
      const messageJumbotron = document.getElementById('message');
      messageJumbotron.innerText = response;
      messageJumbotron.style.display = 'block';
    } catch(error) {
      console.error('Error connecting to te API: ' + error);
    }
  };*/