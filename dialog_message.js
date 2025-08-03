function createMessageButton(optionMessage, callback) {
    let elem = document.createElement("button");
    elem.appendChild(document.createTextNode(optionMessage));
    elem.addEventListener("click", callback);
    return elem;
}

function showDialog(messageList, option1, callback1, option2 = null, callback2 = null) {
    let box = document.getElementById("message_window");
    let cover = document.getElementById("message_cover");
    box.replaceChildren();
    for (let line of messageList) {
        box.appendChild(document.createTextNode(line));
        box.appendChild(document.createElement("br"));
    }
    box.appendChild(createMessageButton(option1, callback1));
    if (option2 !== null && callback2 !== null) {
        box.appendChild(createMessageButton(option2, callback2));
    }
    box.style.display = "block";
    cover.style.display = "block";
}

function closeDialog() {
    let box = document.getElementById("message_window");
    let cover = document.getElementById("message_cover");
    box.style.display = "none";
    cover.style.display = "none";
    box.replaceChildren();
}
