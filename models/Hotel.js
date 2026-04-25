const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema(
  {
    hotel_name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    district: {
      type: String,
      required: [true, "Please add a district"],
    },
    province: {
      type: String,
      required: [true, "Please add a province"],
    },
    postalcode: {
      type: String,
      required: [true, "Please add a postalcode"],
      maxlength: [5, "Postal Code can not be more tahn 5 digits"],
    },
    telephone: {
      type: String,
    },
    region: {
      type: String,
      required: [true, "Please add a region"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please add a valid email",
      ],
    },
    imageURL: {
      type: String,
      default: "no-photo.jpg",
    },
    price: {
      type: number,
      required: [true, "Please add a price"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

HotelSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "hotel",
  justOne: false,
});

module.exports = mongoose.model("Hotel", HotelSchema, "hotel999");
