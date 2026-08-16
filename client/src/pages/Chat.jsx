import { useContext } from "react";
import PotentialChats from "../components/chat/PotentialChats";
import UserChat from "../components/chat/UserChat";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import ChatBox from "../components/chat/ChatBox";

const Chat = () => {
  const { user } = useContext(AuthContext);

  const {
    userChats,
    isUserChatsLoading,
    updateCurrentChat,
  } = useContext(ChatContext);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-900 overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-[350px] border-r border-slate-700 bg-slate-900 flex flex-col">

        {/* Potential Chats */}
        <div className="p-4 border-b border-slate-700">
          <PotentialChats />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {isUserChatsLoading && (
            <p className="text-slate-400">
              Loading chats...
            </p>
          )}

          {!isUserChatsLoading &&
            userChats?.length < 1 && (
              <p className="text-slate-400">
                No chats yet.
              </p>
            )}

          {userChats?.map((chat, index) => (
            <div
              key={index}
              onClick={() => updateCurrentChat(chat)}
            >
              <UserChat chat={chat} user={user} />
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 p-6 bg-slate-950">
        <ChatBox />
      </div>
    </div>
  );
};

export default Chat;