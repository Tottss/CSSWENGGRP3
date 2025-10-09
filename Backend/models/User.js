import mongoose from "mongoose";

// update fields later if needed
const userSchema = mongoose.Schema({
  user_name: { type: String, required: true, unique: true },
  user_email: { type: String, required: true, unique: true },
  user_password: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);
