const socket = io(); // to communicate with socketio we did this, now we can send events or recieve events from clients

const form = document.querySelector("#message-form");
const sendLocationBtn = document.querySelector("#send-location");
const formSendButton = document.querySelector(".send-btn");
const input = document.querySelector(".inp");
const $messages = document.querySelector("#messages");

// Template
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); // when we join room we have url as: http://localhost:3000/chat.html?username=Andrew&room=Phily, location.search is ?username=Andrew&room=Phily so to parse it we use Qs library

const autoScroll = () => {
  // New msg element
  const $newMessage = $messages.lastElementChild;

  // Height of new msg
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of msgs container
  const containerHeight = $messages.scrollHeight;

  // How far i have scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (
    containerHeight - newMessageHeight >= scrollOffset ||
    containerHeight - newMessageHeight <= scrollOffset
  ) {
    console.log("Inside");
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm A"), // we are using moment library to show time in a good way
  }); // we are using Mustache library and we render our data in this way
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (location) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm A"),
  }); // we are using Mustache library and we render our data in this way
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // disable
  formSendButton.setAttribute("disabled", "disabled"); // so our form will be disabled once we send our msg

  let message = e.target.elements.message.value; // e.target refers to form and we can select elements of form using the name property we defined in html
  socket.emit("sendMessage", message, (error) => {
    // enable
    formSendButton.removeAttribute("disabled");
    input.value = "";
    input.focus(); // to set focus back to input

    if (error) return console.log(error);
    console.log("The message was delivered");
  }); // 3rd argument here is for acknowledgement
});

sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert(`Geolocation is not supported by your browser`);
  }
  sendLocationBtn.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude})`,
      () => {
        sendLocationBtn.removeAttribute("disabled");
        console.log("Location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

/*
socket.on("countUpdated", (count) => {
  // first argument should be same as we defined in server
  console.log(`The count have been updated ${count}`);
});

const button = document.querySelector("#increment");
button.addEventListener("click", () => {
  console.log("clicked");
  socket.emit("increment"); // we can aslo emit data from client side
});
*/
