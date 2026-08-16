import { useEffect, useState } from "react";
import { baseUrl, getRequest } from "../utils/services";

export const useFetchRecipientUser = (chat, user) => {
    const [recipientUser, setRecipientUser] = useState(null);
    const [error, setError] = useState(null);
    const recipientId = chat?.members?.find(
        (id) => String(id) !== String(user?._id)
    );

    useEffect(() => {
        const getUser = async () => {
            if (!recipientId) return;

            try {
                const response = await getRequest(`${baseUrl}/users/find/${recipientId}`);
                if (response.error) {
                    throw new Error(response.error);
                }
                setRecipientUser(response);
            } catch (error) {
                setError(error.message);
            }
        };

        getUser();
    }, [recipientId]);

    return { recipientUser, error };
};
