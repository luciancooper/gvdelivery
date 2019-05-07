const express = require('express');
const db = require('./db');
const router = express.Router();

router.get('/admin',(req, res) => {
    db.getAdminData((data,err) => {
        if (err) return res.json({error:err});
        res.json(data);
    });
});

router.post('/login',(req,res) => {
    let data = {
        username:req.body.username,
        password:req.body.password,
    };
    db.checkLogin(data,(result,err) => {
        if (err) return res.json({error:err});
        return res.json(data);
    });
});

module.exports = router;