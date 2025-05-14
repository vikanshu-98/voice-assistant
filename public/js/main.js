
const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function showText(text) {
  document.getElementById('displayText').innerText = text
}

function showAnimation() {
  document.getElementById('animationContainer').classList.remove('hidden');
}
function hideAnimation() {
  document.getElementById('animationContainer').classList.add('hidden');
}


function startRecognition() {

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
    showAnimation()
    showText(' 🎧 Listening...');
  }

  recognition.onresult = async function (event) {
    const transcript = event.results[0][0].transcript
    showText(`You said: ${transcript}`);

    const reply = await callGemini(transcript)
    showText(`Niko : ${reply}`);
    await speak(reply)
  }

  recognition.onerror = function (event) {
    showText('Error occurred in recognition: ' + event.error);
    hideAnimation()
  }

  recognition.onend = function () {
    hideAnimation()
  }

  recognition.start();
}



async function callGemini(userInput) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: userInput })
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
  showAnimation()
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
  const audio = document.getElementById('audio');
  audio.src = audioUrl;
  audio.style.display = 'block';
  audio.onended = hideAnimation
  audio.play();
}