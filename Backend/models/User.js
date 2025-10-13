import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence"; // npm install mongoose-sequence
const AutoIncrement = mongooseSequence(mongoose);

// update fields later if needed
const userSchema = mongoose.Schema({
  user_name: { type: String, required: true, unique: true },
  user_email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
});

// add auto-incrementing user_id
userSchema.plugin(AutoIncrement, { inc_field: "user_id" });

export default mongoose.model("User", userSchema);
