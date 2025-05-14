
const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micButton   =  document.getElementById('micButton')
const displayText  =  document.getElementById('displayText')
const audio = document.getElementById('audio')
let sessionId =  Date.now().toString()
let userName = ''

window.onload = async ()=>{
  const intialReply  = `Hi, i am Luna your AI angry girfriend. What's you name?`
  showText(intialReply)
  await speak(intialReply) 
}

function toggleActive(isActive){
  if(isActive){
    micButton.classList.add('active')
  }else{
    micButton.classList.remove('active')
  }
}

function showText(text) {
  displayText.innerText = text
}

function showAnimation() {
  document.getElementById('animationContainer').classList.remove('hidden');
}
function hideAnimation() {
  document.getElementById('animationContainer').classList.add('hidden');
}


window.startRecognition = function() { 
  if (!speechRecognition) {
    showText('Speech recognition not supported in this browser.');
    return;
  }

  const recognition = new speechRecognition();
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    toggleActive(true)
    showText(' 🎧 Listening...');
  }

  recognition.onresult = async function (event) {
    const transcript = event.results[0][0].transcript
    showText(`You said: ${transcript}`);



    if (!userName) {
      const nameMatch = transcript.match(/my name is ([a-zA-Z]+)/i);
      if (nameMatch && nameMatch[1]) {
        userName = nameMatch[1];
        const reply = await callGemini(transcript,true)
        showText(`Luna : ${reply}`)
        await speak(reply)
        return 
      }
    }

    const reply = await callGemini(transcript)
    showText(`Luna : ${reply}`);
    await speak(reply)
  }

  recognition.onerror = function (event) {
    showText('Error occurred in recognition: ' + event.error);
    toggleActive(false)
  }

  recognition.onend = function () {
    toggleActive(false)
  }

  recognition.start();
}



async function callGemini(userInput,isInit=false) {
  try {
    if(userName && isInit){
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: userInput,type:'init',name:userName,sessionId })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.reply;
    }
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: userInput,sessionId })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {

    console.error('Error:', error);
    return "Sorry, I didn’t get that.";
  }

}


async function speak(reply) {
  toggleActive(true)
  const response = await fetch('/api/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: reply })
  })
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  // c/onst audio = document.getElementById('audio');
  audio.src = audioUrl;
  audio.style.display = 'block';
  audio.classList.remove('hidden')
  audio.onended = toggleActive(false)
  setTimeout(() => {
    audio.play().catch(err => {
      console.warn("Playback error:", err.message);
    });
  }, 100);
}