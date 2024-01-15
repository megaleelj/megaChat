
const mongoose = require("mongoose");


class Database {

    constructor(){
        this.connect();
    }

    connect() {
        mongoose.connect("mongodb+srv://mega4lj:08138172263m@megachatcluster.qtzpon7.mongodb.net/?retryWrites=true&w=majority")
.then(() => {
    console.log("successful connection");
})
.catch(() => {
    console.log("connection error" + err);
})
    }
}

module.exports = new Database();