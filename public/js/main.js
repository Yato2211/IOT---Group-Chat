import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js';

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
var db = null;

var app = null;
const firebaseConfig = {
  apiKey: "AIzaSyAgfZ8M7rPNPBnqzK6gYlnIiMgeuXEVqW4",
  authDomain: "thong-pro.firebaseapp.com",
  projectId: "thong-pro",
  storageBucket: "thong-pro.appspot.com",
  messagingSenderId: "729502608583",
  appId: "1:729502608583:web:74b5917d91887495b2a2e2",
  measurementId: "G-096LW05SS8"
}


import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-storage.js"
var files = [];
var reader = new FileReader();
var myimg = document.getElementById('myimg');
var proglab = document.getElementById('upprogress');
var SelBtn = document.getElementById('selbtn');
var DelBtn = document.getElementById('delbtn');

var input = document.createElement('input');

var imageURL;
input.type = 'file';
input.onchange = (e) => {
  files = e.target.files;
  reader.readAsDataURL(files[0]);
  UploadProcess();
}
reader.onload = function () {
  myimg.src = reader.result;
}
//get input image
SelBtn.onclick = function () {
  input.click();
}
// delete Image
DelBtn.onclick = () => {
  imageURL = null;
  proglab.innerHTML = null;
  myimg.removeAttribute('src');
}
// upload image
async function UploadProcess() {
  var ImgToUpload = files[0];
  var ImgName = "image Upload at" + Date.now();

  const metaData = {
    contentType: ImgToUpload.type
  }
  const storage = getStorage();
  const storageRef = sRef(storage, 'Images/' + ImgName);
  const UploadTask = uploadBytesResumable(storageRef, ImgToUpload, metaData);
  UploadTask.on('state-changed', (snapshot) => {
    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    proglab.innerHTML = "Upload" + progress + "%";
  },
    (error) => {
      alert("Error: Image not uploaded !");
    },
    () => {
      getDownloadURL(UploadTask.snapshot.ref).then((downloadURL) => {
        imageURL = downloadURL;
      });
    });
}

/* đợi load lại trang*/
window.onload = async () => {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  const q = query(collection(db, "chat"), where("room", "==", room), orderBy('createdAt'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    //console.log(doc.id, " => ", JSON.stringify(doc.data()));
    outputMessage1(doc.data());
  });
}

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});


// Message submit
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Get message text
  let msg = e.target.elements.msg.value;
  msg = msg.trim();
  if (!msg && !imageURL) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  /* đẩy dữ liệu lên firebase */
     var data = { username, msg, imageURL: imageURL == undefined ? null : imageURL, room, createdAt: new Date() };
     try {
      await addDoc(collection(db, "chat"), data);
    } catch (error) {
      console.log(error);
  }

  // Clear input
  e.target.elements.msg.value = '';
  imageURL = null;
  proglab.innerHTML = null;
  myimg.removeAttribute('src');
  e.target.elements.msg.focus();
});

/* In dữ liệu thu được từ firebase ra user interface */
function outputMessage1(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${formatDateTime(new Date(message.createdAt * 1000))}</span>`;

  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.msg;
  var paraImg = new Image();
  paraImg.src = message.imageURL;
  paraImg.style.maxHeight = "12em";
  paraImg.style.maxWidth = "12em";
  paraImg.style.objectFit = "contain";
  if (message.username == username) {
    p.classList.add('to-right');
    para.classList.add('to-right');
    paraImg.classList.add('to-right');
  }
  div.appendChild(para);
  console.log(message.imageURL);
  message.imageURL && div.appendChild(paraImg);
  document.querySelector('.chat-messages').appendChild(div);
}

/* cách để format thời gian trong JS */
function formatDateTime(_date) {
  if (_date != null) {
    var date = new Date(_date);
    var day = date.getDate();
    day = (day < 10) ? '0' + day : day;
    var month = date.getMonth() + 1;
    month = (month < 10) ? '0' + month : month;
    var hour = date.getHours();
    hour = (hour < 10) ? '0' + hour : hour;
    var minit = date.getMinutes();
    minit = (minit < 10) ? '0' + minit : minit;
    return hour + ":" + minit + " " + day + '/' + month;
  }
  else {
    return '';
  }
}

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;

  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  var paraImg = new Image();
  paraImg.src = imageURL;
  paraImg.style.maxHeight = "12em";
  paraImg.style.maxWidth = "12em";
  paraImg.style.objectFit = "contain";
  div.appendChild(para);
  imageURL && div.appendChild(paraImg);
  p.classList.add('to-right');
  para.classList.add('to-right');
  document.querySelector('.chat-messages').appendChild(div);
}


// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  } else {
  }
});
