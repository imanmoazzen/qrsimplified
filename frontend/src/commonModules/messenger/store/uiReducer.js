import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

export const USER_MESSAGE_TYPES = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  WAITING: "waiting",
  SUCCESS: "success",
  UPDATE: "update",
};

export const initialState = {
  messages: [],
};

export const slice = createSlice({
  name: "message",
  initialState,
  reducers: {
    clearAllMessages: (state) => {
      state.messages = [];
    },
    addMessage: (state, action) => {
      const text = action.payload.text;
      const html = action.payload.html;
      const isHtml = html ? true : false;
      let messageContent = html ? html : text;
      // handle the case where neither text nor html is provided
      if (!messageContent) {
        messageContent = "No message text provided";
      }

      let isRepeatMessage = false;
      let lastMessage;
      const currentMessages = state.messages;
      if (currentMessages.length > 0) {
        lastMessage = [...currentMessages].pop();
        const isSameMessage = messageContent === lastMessage?.content?.messageContent;
        const isSameType = action.payload.type === lastMessage?.type;
        isRepeatMessage = isSameMessage && isSameType;
      }

      const content = {
        isHtml,
        messageContent,
      };

      if (isRepeatMessage) {
        const updatedMessage = {
          ...lastMessage,
          id: uuidv4(),
          replay: true,
        };
        const currentId = currentMessages.findIndex((x) => x.id == lastMessage.id);
        state.messages[currentId] = updatedMessage;
      } else {
        state.messages.push({
          id: action.payload.id ? action.payload.id : uuidv4(),
          type: action.payload.type ? action.payload.type : USER_MESSAGE_TYPES.ERROR,
          content,
          duration: action.payload.duration ? action.payload.duration : 0,
        });
      }
    },
    removeMessageByID: (state, action) => {
      state.messages = state.messages.filter((msg) => msg.id !== action.payload.id);
    },
  },
});

export const { clearAllMessages, addMessage, removeMessageByID } = slice.actions;

export default slice.reducer;
