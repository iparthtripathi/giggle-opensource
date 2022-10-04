const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
require('../db/conn');


const User = require('../model/userschema')

router.get('/', (req, res) => {
    res.send('hello from routes');
})



router.post('/register', async (req, res) => {
    const { name, email, phone, work, password, cpassword, devprof } = req.body;

    if (!name || !email || !phone || !work || !password || !cpassword) {
        return res.status(423).json({ error: "incomplete information" })
    }
    try {
        const userExist = await User.findOne({ email: email });
        const userExistbyName = await User.findOne({ name: name });
        if (userExist) {
            return res.status(422).json({ error: "user already exist" });
        }
        else if (userExistbyName) {
            return res.status(422).json({ error: "user already exist" });
        }
        else if (password != cpassword) {
            return res.status(424).json({ error: "password doesn't match" });
        }

        const user = new User({ name, email, phone, work, password, cpassword, devprof });

        const userRegister = await user.save();

        if (userRegister) {
            res.status(201).json({ message: "Registered successfully" });

        }
        else {
            res.status(500).json({ error: 'failed to register' });

        }
    } catch (err) {
        console.log(err);
    }
})

//login 
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Please fill the data" })
        }

        const userLogin = await User.findOne({ email: email });
        if (!userLogin) {
            res.status(400).json({ error: "Invalid Credentials" })
        }
        else if (userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);
            const token = await userLogin.generateAuthToken();
            console.log(token);

            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 25892000000),
                httpOnly: true
            });

            if (!isMatch) {
                res.status(400).json({ error: "Invalid Credentials" });
            }
            else {
                res.status(401).json({ message: "user signin successfull" })
            }
        }

    } catch (err) {
        console.log(err);
    }

});




//abt us
router.use(cookieParser());
router.get('/about', authenticate, (req, res) => {

    res.send(req.rootUser);
})
router.get('/projects', authenticate, (req, res) => {

    res.send(req.rootUser);
})
/////////write page
router.post('/projdata', authenticate, async (req, res) => {
    const { projname, member, modname, percent, remarks } = req.body;
    if (!projname || !member || !modname || !remarks) {
        console.log("error in form")
        return res.json({ error: "plz fill all the fields" });
    }

    try {

        const userWrite = await User.findOne({ _id: req.userID });
        if (userWrite) {
            const userProj = await userWrite.addMessage(projname, member, modname, percent, remarks)

            await userWrite.save();

            res.status(201).json({ message: "stored successfully" })
        }
        else if (!userWrite) {
            res.status(400).json({ message: "no" })
        }

    }

    catch (error) {
        console.log(error);
    }

})


router.post('/userNamedata', authenticate, async (req, res) => {
    const { username } = req.body;

    if (!username) {
        console.log("error in form")
        return res.json({ error: "plz fill all the fields" });
    }
    try {

        const userNameWrite = await User.findOne({ _id: req.userID });
        // if (userNameWrite) {
        //     const userProj = await userNameWrite.userName(username)

        //     await userNameWrite.save();

        //     res.status(201).json({ message: "stored successfully" })
        // }
        // else if (!userNameWrite) {
        //     res.status(400).json({ message: "not saved" })
        // }
        const userExistbyName = await User.findOne({ name: username });
        if (userExistbyName) {

            res.status(201).json(userExistbyName)
            // })
        }
        else if (!userExistbyName) {
            res.status(400).json({ error: "Invalid Credentials" });
        }
    }

    catch (error) {
        console.log(error);
    }

})


// })
// router.get('/getUser', authenticate, (req, res) => {


// })

router.route("/members").get((req, res) => {
    User.find()
        .then(foundUsers => res.json(foundUsers))

})

// router.get('/projects', authenticate, (req, res) => {

//     res.send(req.rootUser);
// })

router.get('/logout', (req, res) => {

    res.clearCookie('jwtoken', { path: '/' })
    res.send('logged out')

})

module.exports = router;
