import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const PotentialChats = () => {
    const {user} = useContext(AuthContext)
    const {
        potentialChats,
        createChat,
        onlineUsers,
        telegramBotOnline,
        TELEGRAM_USER_ID,
    } = useContext(ChatContext);

    return (
        <>
            <div className="all-users">
                {potentialChats && potentialChats.map((u, index) => {
                    const isTelegramBot =
                        (
                            Boolean(TELEGRAM_USER_ID) &&
                            String(u?._id) === String(TELEGRAM_USER_ID)
                        ) ||
                        String(u?.name || "").toLowerCase() === "telegrambot";

                    const isOnline = isTelegramBot
                        ? Boolean(telegramBotOnline)
                        : onlineUsers?.some(
                            (onlineUser) =>
                                String(onlineUser?.userId) === String(u?._id)
                        );

                    return (
                    <div 
                        className="single-user" 
                        key={index} 
                        onClick={() => createChat(user._id, u._id)}
                    >
                        {u.name}
                        <span className={
                            isOnline
                            ?"user-online" 
                            : ""}></span>
                    </div>
                    );
                    
                })}
            </div>
        </>
    );
};

export default PotentialChats;
