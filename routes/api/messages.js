const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');
const Notification = require('../../schemas/NotificationSchema');
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (req, res, next) => {
    if (!req.body.content || !req.body.chatId || !req.session.user || !req.session.user._id) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    const newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    };

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
    
        let message = await Message.create(newMessage);

        
        await Promise.all([message.populate("chat"), message.populate("sender")]);
        message = await User.populate(message, {path: "chat.users"});
    
        var chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message }).session(session);
    
        await session.commitTransaction();
        session.endSession();
    
        insertNotification(chat, message);

        res.status(201).send(message);
    } catch (error) {
        session.endSession();
        console.error(error);
        res.sendStatus(400);
    }
});

    function insertNotification(chat, message) {
        if (chat && chat.users && Array.isArray(chat.users)) {
            chat.users.forEach(userId => {
                if (userId == message.sender._id.toString()) return;
    
                Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id);
            });
        } else {
            console.error("Invalid chat object or users array.");
        }
    }
    
module.exports = router;