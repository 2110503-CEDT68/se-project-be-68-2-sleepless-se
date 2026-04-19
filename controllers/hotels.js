const Hotel = require("../models/Hotel");
const Booking = require('../models/Booking.js');

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
        const allowedFields = {};
        if (req.body.hotel_name)  allowedFields.hotel_name  = req.body.hotel_name;
        if (req.body.address)     allowedFields.address     = req.body.address;
        if (req.body.district)    allowedFields.district    = req.body.district;
        if (req.body.province)    allowedFields.province    = req.body.province;
        if (req.body.postalcode)  allowedFields.postalcode  = req.body.postalcode;
        if (req.body.telephone)   allowedFields.telephone   = req.body.telephone;
        if (req.body.region)      allowedFields.region      = req.body.region;
        if (req.body.description) allowedFields.description = req.body.description;
        if (req.body.email)       allowedFields.email       = req.body.email;
        if (req.body.imageURL)    allowedFields.imageURL    = req.body.imageURL;

        const hotel = await Hotel.findByIdAndUpdate(req.params.id, allowedFields, {
            new: true,
            runValidators: true
        });

        if (!hotel) {
            return res.status(404).json({ success: false, msg: 'Hotel not found' });
        }

        res.status(200).json({ success: true, data: hotel });
    } catch (err) {
        console.error(err.stack);
        res.status(400).json({ success: false, msg: err.message });
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
