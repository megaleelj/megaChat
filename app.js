const express = require('express');
const app = express ();
const port = 3000;
const middleware = require('./middleware')
const path = require('path')
const bodyParser = require("body-parser")
const mongoose = require("./database");
const session = require('express-session');
const io = require("socket.io")
const webpush = require('web-push');


app.use(bodyParser.json());
const publicVapidKey = 'BOUzCkvBRMgAdKK6xgnoFqbn5qX1wS_aPvzZpjStPGmglfP5io3NC8L7GAssPkMuePxOvyKB_wQYqTs5ZijwEY0';

const privateVapidKey = '0_BbMcBqmv1SQYEXslHQQXNdpxQ8VsAUiIEFVYCe6uo';

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);

const server = app.listen(port, () => console.log("Server listening on port" + port));
const socketIo = io(server, { pingTimeout: 6000 });

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded ({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));





app.use(session({
    secret: "megachat",
    resave: true,
    saveUninitialized: false
}))

// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const notificationsRoute = require('./routes/notificationRoutes');


//Api routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const messagesApiRoute = require('./routes/api/messages');
const notificationsApiRoute = require('./routes/api/notifications');
const { Socket } = require('dgram');
const { error } = require('console');

app.use('/images', express.static('images'));

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/post",middleware.requireLogin, postRoute);
app.use("/profile",middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/notifications", middleware.requireLogin, notificationsRoute);

app.use("/api/posts", postsApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);
app.use("/api/notifications", notificationsApiRoute);


app.get("/", middleware.requireLogin, (req, res, next) => {

    var payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }

    res.status(200).render("home", payload);
})

socketIo.on("connection", (socket) => {
    
    socket.on("setup", userData => {
        socket.join(userData._id);
        socket.emit("connected");
    })

    socket.on("join room", room => socket.join(room));
    socket.on("typing", room => socket.in(room).emit("typing"));
    socket.on("stop typing", room => socket.in(room).emit("stop typing"));
    socket.on("notification received", room => socket.in(room).emit("notification received"));

    socket.on("new message", newMessage => {
        var chat = newMessage.chat;

        if(!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach(user => {
            if (user._id == newMessage.sender._id) return;
            socket.in(user._id).emit("message received", newMessage);
        });
        
    });
});


// Subscribe Route
app.post('/subscribe', (req, res) => {
    // Get pushSubscription object
    const Subscription = req.body;

    res.status(201).json({});

    const payload = JSON.stringify({title: 'Push Test'});

    webpush.sendNotification(Subscription, payload).catch(error => console.log(error));
});