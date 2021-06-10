import "./App.css";
import { io } from "socket.io-client";
import logo from "./assets/chat.png";
import { useEffect, useRef, useState } from "react";

import CreateUser from "./components/CreateUser";
import OnlineUsers from "./components/OnlineUsers";
import MessagesControl from "./components/MessagesControl";

const socket = io(`http://localhost:7000`);

function App() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [receiver, setReceiver] = useState("");
  const [avatar, setAvatar] = useState("");
  const [media, setMedia] = useState(null);
  const [users, setUsers] = useState({});
  const [message, setMessage] = useState("");
  const [groupMessage, setGroupMessage] = useState({});
  const receiverRef = useRef(null);

  const sortNames = (username1, username2) => {
    return [username1, username2].sort().join("-");
  };

  const gotoBottom = () => {
    const el = document.querySelector(".message-area ul");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const onCreateUser = () => {
    socket.emit("new_user", username);
    receiverRef.current = username;
    const a = Math.floor(Math.random() * 8) + ".png";
    setAvatar(a);

    setStep((prevStep) => prevStep + 1);
  };

  const onUserSelect = (username) => {
    setReceiver(username);
    setStep((prevStep) => prevStep + 1);
  };

  const onChatClose = () => {
    setStep(1);
    setReceiver("");
    receiverRef.current = null;
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const data = {
      sender: username,
      receiver,
      message,
      media,
      avatar,
      view: false,
    };

    socket.emit("send_message", data);

    const key = sortNames(username, receiver);
    const tempGroupMessage = { ...groupMessage };
    if (key in tempGroupMessage) {
      tempGroupMessage[key] = [
        ...tempGroupMessage[key],
        { ...data, view: true },
      ];
    } else {
      tempGroupMessage[key] = [
        {
          ...data,
          view: true,
        },
      ];
    }

    setGroupMessage({ ...tempGroupMessage });

    if (media !== null) {
      setMedia(null);
    }

    setMessage("");
  };

  const checkUnseenMessages = (receiver) => {
    const key = sortNames(username, receiver);
    let unseenMessages = [];
    if (key in groupMessage) {
      unseenMessages = groupMessage[key].filter((msg) => !msg.view);
    }

    return unseenMessages.length;
  };
  console.log(groupMessage);

  useEffect(() => {
    socket.on("new_user", (users) => {
      console.log(users);
      setUsers(users);
    });

    socket.on("new_message", (data) => {
      setGroupMessage((preGroupMessage) => {
        const message = { ...preGroupMessage };
        const key = sortNames(data.sender, data.receiver);

        if (receiverRef.current === data.sender) {
          data.view = true;
        }

        if (key in message) {
          message[key] = [...message[key], data];
        } else {
          message[key] = [data];
        }
        return { ...message };
      });
    });
  }, []);
  console.log(receiver);

  useEffect(() => {
    //here we are going to update view count of selected user = receiver
    updateMessageView();
    console.log(receiver);
  }, [receiver]);

  const updateMessageView = () => {
    const key = sortNames(username, receiver);
    if (key in groupMessage) {
      const messages = groupMessage[key].map((msg) =>
        !msg.view ? { ...msg, view: true } : msg
      );

      groupMessage[key] = [...messages];

      setGroupMessage({ ...groupMessage });
    }
  };

  useEffect(() => {
    const key = sortNames(username, receiver);
    if (key in groupMessage) {
      // if (groupMessage[key].length > 0) {
      gotoBottom();
      // }
    }
  }, [groupMessage]);

  console.log(groupMessage);
  return (
    <div className="App">
      <header className="app-header">
        <img src={logo} alt="" />
        <div className="app-name b-500 primaryColor">My Chat</div>
      </header>

      <div className="chat-system">
        <div className="chat-box">
          {/* step1:  ask username ro email */}
          {step === 0 ? (
            <CreateUser
              onCreateUser={onCreateUser}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          ) : null}
          {/* Step2: show all available users */}
          {step === 1 ? (
            <OnlineUsers
              onUserSelect={onUserSelect}
              users={users}
              username={username}
              checkUnseenMessages={checkUnseenMessages}
            />
          ) : null}
          {/* Step3: select user and switch to chat window */}
          {step === 2 ? (
            <MessagesControl
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sendMessage={sendMessage}
              groupMessage={groupMessage}
              sortNames={sortNames}
              username={username}
              receiver={receiver}
              setMedia={setMedia}
              onChatClose={onChatClose}
              media={media}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
