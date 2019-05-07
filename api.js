const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const router = express.Router();

router.get('/admin',(req, res) => {
    db.selectRestaurants(function(result1,err) {
        if (err) return res.json({error:err});
        db.getOrdersAdmin(function(result2,err) {
            if (err) return res.json({error:err});
            res.json({
                users:result1.rows,
                orders:result2.rows
            });
        });
    });
});

router.post('/login',(req,res) => {
    let username = req.body.username;
    let password = req.body.password;
    db.checkUsername(username,function(user,err) {
        if (err) return res.json({error:err});
        if (!user) {
            return res.json({
                success:false,
                message:"Invalid Username",
            });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return res.json({
                success:false,
                message:"Incorrect Password",
            });
        }
        return res.json({
            success:true,
            id:user.id
        });
    });
});

module.exports = router;