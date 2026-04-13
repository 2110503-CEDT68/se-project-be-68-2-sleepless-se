const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

exports.getBookings = async (req, res, next) => {
  let query;

  // 1. ถ้าไม่ใช่ Admin ให้เห็นเฉพาะของตัวเอง (ดึงแค่ข้อมูลโรงแรม ไม่ต้องดึงข้อมูล user)
  if (req.user.role !== 'admin') {
    query = Booking.find({ user: req.user.id })
      .populate({
        path: 'hotel',
        select: 'hotel_name address telephone'
      });
  } else {
    // 2. สำหรับ Admin ให้ดึงข้อมูล user (name, email) มาด้วย เพื่อดูว่าใครเป็นคนจอง
    if (req.params.hotelId) {
      query = Booking.find({ hotel: req.params.hotelId })
        .populate({
          path: 'hotel',
          select: 'hotel_name address telephone'
        })
        .populate({
          path: 'user', // ดึงข้อมูลคนจองให้ Admin เห็น
          select: 'name email'
        });
    } else {
      query = Booking.find()
        .populate({
          path: 'hotel',
          select: 'hotel_name address telephone'
        })
        .populate({
          path: 'user', // ดึงข้อมูลคนจองให้ Admin เห็น
          select: 'name email'
        });
    }
  }

  try {
    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 
      success: false, 
      message: "Cannot find Booking" 
    });
  }
};


exports.getBooking = async (req, res, next) => {
    try {
        
        const booking = await Booking.findById(req.params.id).populate({
            path: 'hotel', 
            select: 'hotel_name address telephone'
        });

       
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

       
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to view this booking`
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot find Booking"
        });
    }
};

exports.addBooking = async (req, res, next) => {
    try {
        // 1. ตรวจสอบว่าเอา Hotel ID มาจากไหน (URL หรือ Body)
        const hotelId = req.params.hotelId || req.body.hotel;

        if (!hotelId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a hotel ID either in URL or in Body"
            });
        }

        // 2. ตรวจสอบวันที่ (เหมือนเดิม)
        const { checkInDate, checkOutDate } = req.body;
        if (!checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide both checkInDate and checkOutDate"
            });
        }

        // 3. คำนวณจำนวนคืน (เหมือนเดิม)
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (diffNights > 3) {
            return res.status(400).json({
                success: false,
                message: `Booking cannot exceed 3 nights. You requested ${diffNights} nights.`
            });
        }

        // 4. เตรียมข้อมูลลง Body เพื่อบันทึก
        req.body.hotel = hotelId; // ใช้ hotelId ที่หาได้จากข้อ 1
        req.body.user = req.user.id;

        // 5. ตรวจสอบว่าโรงแรมมีอยู่จริงไหม
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `No hotel with the id of ${hotelId}`
            });
        }

        // 6. บันทึก
        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot create Booking"
        });
    }
};

exports.updateBooking = async (req,res,next)=>{
    try{
        let booking = await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({
                success:false,
                message:`No booking with the id of ${req.params.id}`
            });
        }

        if(booking.user.toString()!==req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success:false,
                message:`User ${req.user.id} is not authorized to update this booking`
            });
        }

        booking= await Booking.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(200).json({
            success:true,
            data: booking
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Cannot update Booking"
        });
    }
};

exports.deleteBooking = async (req,res,next)=>{
    try{
        const booking = await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({
                success:false,
                message:`No booking with the id of ${req.params.id}`
            });
        }

        if(booking.user.toString()!==req.user.id && req.user.role!=='admin'){
            return res.status(401).json({
                success:false,
                message:`User ${req.user.id} is authorized to delete this booking`
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success:true,
            data: {}
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Cannot delete Booking"
        });
    }
};