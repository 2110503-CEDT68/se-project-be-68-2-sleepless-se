const Hotel = require("../models/Hotel");
const Booking = require('../models/Booking.js');
const HotelSubmission = require('../models/HotelSubmission');

exports.getHotels= async (req,res,next) => {
    let query;
    const reqQuery = {...req.query};
    const removeFields=['select','sort','page','limit'];
    removeFields.forEach(param=>delete reqQuery[param]);
    console.log(reqQuery);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match=>`$${match}`);

    query=Hotel.find(JSON.parse(queryStr)).populate('bookings');

    if(req.query.select){
        const fields=req.query.select.split(',').join(' ');
        query=query.select(fields);
    }
    if(req.query.sort){
        const sortBy=req.query.sort.split(',').join(' ');
        query=query.sort(sortBy);
    } else{
        query=query.sort('-createdAt');
    }

    const page=parseInt(req.query.page,10)|| 1;
    const limit = parseInt(req.query.limit,10)||25;
    const startIndex=(page-1)*limit;
    const endIndex=page*limit;
    try{
       const total = await Hotel.countDocuments();
        query=query.skip(startIndex).limit(limit);

        const hotels = await query;

        const pagination ={};
        if(endIndex<total){
            pagination.next={
                page:page+1,
                limit
            }
        }

        if(startIndex>0){
            pagination.prev={
                page:page-1,
                limit
            }
        }

        res.status(200).json({
            success:true, count:hotels.length,pagination, data:hotels
        });
    } catch(err){
        res.status(400).json({success:false});
    }
};

exports.getHotel=async (req,res,next) => {
    try{
        const hotel = await Hotel.findById(req.params.id);
        
        if(!hotel){
            return res.status(400).json({success:false});
        }

        res.status(200).json({
            success:true, 
            data:hotel
        });
    } catch(err){
        res.status(400).json({success:false});
    }
};

exports.createHotel= async (req,res,next) => {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
        success:true,
        data:hotel
    });
};

exports.updateHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ success: false, message: 'ไม่พบโรงแรมนี้ในระบบ' });
        }

        // (Optional) ถ้ามีระบบ Login ควรเช็คด้วยว่าคนที่กดแก้ ใช่เจ้าของโรงแรมไหม
        // if (hotel.manager.toString() !== req.user.id && req.user.role !== 'admin') {
        //     return res.status(401).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขโรงแรมนี้' });
        // }

        const submission = await HotelSubmission.create({
            hotel: req.params.id,      
            hotelData: req.body,       
            manager: req.user.id,      
            status: 'PENDING'         
        });

        res.status(200).json({ 
            success: true, 
            message: 'ส่งคำขอแก้ไขสำเร็จ กรุณารอแอดมินอนุมัติ',
            data: submission 
        });

    } catch (err) {
        console.log("Update Request Error: ", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteHotel= async (req, res,next) => {
    try{
        const hotel = await Hotel.findById(req.params.id);

        if(!hotel){
            return res.status(404).json({
                success:false,
                message:`Hotel not found with id ${req.params.id}`
            });
        }

        await Booking.deleteMany({hotel:req.params.id});
        await Hotel.deleteOne({_id: req.params.id});

        res.status(200).json({success:true, data: {}});
    } catch(err){
        res.status(400).json({success:false});
    }
};
