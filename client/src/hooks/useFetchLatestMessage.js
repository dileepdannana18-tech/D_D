import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { baseUrl, getRequest } from "../utils/services";

export const useFetchLatestMessage = (chat) => {
  const { newMessage, notifications } = useContext(ChatContext);
  const [latestMessage, setLatestMessage] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      if (!chat?._id) {
        return;
      }

      const response = await getRequest(`${baseUrl}/messages/${chat?._id}`);
      if (response.error) {
        return console.log("Error getting messages...", response.message);
      }
      const lastMessage = response[response?.length - 1];
      setLatestMessage(lastMessage);
    };
    getMessages();
  }, [chat?._id, newMessage, notifications]);

  return { latestMessage };
};

export default useFetchLatestMessage;

