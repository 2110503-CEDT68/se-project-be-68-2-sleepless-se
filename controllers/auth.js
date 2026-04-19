const User = require('../models/User');

const sendTokenResponse=(user,statusCode,res)=>{
    const token=user.getSignedJwtToken();

    const options={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly:true
    };

    if(process.env.NODE_ENV==='production'){
        options.secure=true;
    }
    res.status(statusCode).cookie('token',token,options).json({
        success:true,
        token
    });
}


exports.register = async (req, res, next) => {
    try {
        const { name, tel, email, password, role, privacyPolicyAccepted } = req.body;

        if (!privacyPolicyAccepted) {
            return res.status(400).json({
                success: false,
                msg: 'You must accept the privacy policy to register'
            });
        }

        const user = await User.create({
            name, tel, email, password, role, privacyPolicyAccepted
        });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false });
        console.log(err.stack);
    }
}; 

exports.login=async(req,res,next)=>{
    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({success:false, msg:'Please provide an email and password'});
        }

        const user = await User.findOne({email}).select('+password');
        if(!user){
            return res.status(400).json({
                success:false,
                msg:'Invalid credentials'
            });
        }

        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(401).json({
                success:false,
                msg:'Invalid credentials'
            });
        }
        sendTokenResponse(user,200,res);
    } catch(err){
        return res.status(401).json({
            success:false,
            msg: 'Cannot convert email or password to string'
        });
    }
}

exports.getMe=async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        data:user
    });
}

exports.logout=async(req,res,next)=>{
    const role = req.user?.role || "user";

    res.cookie('token','none',{
        expires: new Date(Date.now()+ 10*1000),
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        msg: `${role} Logout successfully`
    });
}
exports.updateProfile = async (req, res, next) => {
    try {
        // 1. กรองเฉพาะฟิลด์ที่อนุญาตให้อัปเดตได้
        // (เราจะไม่รับ email, password หรือ role ตรงนี้เพื่อความปลอดภัย)
        const updatedData = {};
        if (req.body.name) updatedData.name = req.body.name;
        if (req.body.tel) updatedData.tel = req.body.tel;
        if (req.body.profileImageUrl) updatedData.profileImageUrl = req.body.profileImageUrl;

        // 2. ค้นหาและอัปเดตข้อมูลผู้ใช้
        // req.user.id จะมีค่าก็ต่อเมื่อผ่าน Middleware ป้องกัน Route (เช่น protect) มาแล้ว
        const user = await User.findByIdAndUpdate(req.user.id, updatedData, {
            new: true, // คืนค่าข้อมูลใหม่ล่าสุดหลังจากอัปเดตเสร็จ
            runValidators: true // ตรวจสอบ Validation ใน Model อีกรอบ
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // 3. ส่งข้อมูลที่อัปเดตแล้วกลับไป
        res.status(200).json({
            success: true,
            data: user
        });

    } catch (err) {
        console.error(err.stack);
        res.status(400).json({ 
            success: false, 
            msg: err.message || 'Cannot update profile' 
        });
    }
};