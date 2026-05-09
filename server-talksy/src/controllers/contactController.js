import MastUser from "../models/userModel.js";

// ─── Check Contacts - Which phone numbers are on Talksy ───
export const checkContacts = async (request, reply) => {
 try {
  const { phoneNumbers, userId } = request.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
   return reply.code(400).send({
    success: false,
    message: "phoneNumbers array is required"
   });
  }

  // Normalize phone numbers - strip spaces, dashes, and keep last 10 digits
  const normalizePhone = (phone) => {
   const digits = phone.replace(/\D/g, "");
   return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const normalizedNumbers = phoneNumbers.map(normalizePhone).filter(n => n.length >= 10);

  // Find users whose mobile number matches (using last 10 digits comparison)
  const allUsers = await MastUser.find({
   _id: { $ne: userId } // exclude current user
  }).select("username name mobile profilePic about").lean();

  const registeredUsers = [];
  const matchedMobiles = new Set();

  allUsers.forEach(user => {
   const userMobileNormalized = normalizePhone(user.mobile);
   if (normalizedNumbers.includes(userMobileNormalized)) {
    registeredUsers.push({
     _id: user._id,
     username: user.username,
     name: user.name,
     mobile: user.mobile,
     profilePic: user.profilePic,
     about: user.about
    });
    matchedMobiles.add(userMobileNormalized);
   }
  });

  return {
   success: true,
   registeredUsers,
   matchedMobiles: Array.from(matchedMobiles)
  };

 } catch (error) {
  reply.code(500).send({
   success: false,
   message: error.message
  });
 }
};
