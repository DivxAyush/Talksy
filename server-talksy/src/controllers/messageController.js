import UserMessage from "../models/userMessage.js";
import MastUser from "../models/userModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// ─── Send Message ───
export const sendMessage = async (request, reply) => {
    try {
        const { senderId, receiverId, message, replyTo, messageType, mediaUrl, mediaThumbnail, mediaDuration, mediaSize } = request.body;

        const newMessage = new UserMessage({
            senderId,
            receiverId,
            message: message || "",
            messageType: messageType || "text",
            mediaUrl: mediaUrl || "",
            mediaThumbnail: mediaThumbnail || "",
            mediaDuration: mediaDuration || 0,
            mediaSize: mediaSize || 0,
            status: "sent",
            replyTo: replyTo || null
        });

        await newMessage.save();

        // Populate replyTo if present
        let populatedMessage = newMessage.toObject();
        if (replyTo) {
            const repliedMsg = await UserMessage.findById(replyTo)
                .select("message senderId isDeleted")
                .lean();
            populatedMessage.replyToMessage = repliedMsg;
        }

        // Check if receiver is online
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Receiver is online — deliver immediately and mark as delivered
            await UserMessage.findByIdAndUpdate(newMessage._id, { status: "delivered" });
            populatedMessage.status = "delivered";

            // Attach sender name for notification display
            const sender = await MastUser.findById(senderId).select("username name").lean();
            populatedMessage.senderName = sender?.name || sender?.username || "Someone";

            io.to(receiverSocketId).emit("newMessage", populatedMessage);

            // Also notify sender about the delivery status upgrade
            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("message_status_update", {
                    messageId: newMessage._id.toString(),
                    status: "delivered"
                });
            }
        } else {
            // Receiver is OFFLINE — send push notification 📲
            try {
                const [receiver, sender] = await Promise.all([
                    MastUser.findById(receiverId).select("pushToken").lean(),
                    MastUser.findById(senderId).select("username name").lean()
                ]);

                if (receiver?.pushToken) {
                    const senderName = sender?.name || sender?.username || "Someone";
                    // Use appropriate preview text for media messages
                    const msgType = messageType || "text";
                    let previewText = message;
                    if (msgType === "image") previewText = "📷 Photo";
                    else if (msgType === "video") previewText = "🎥 Video";
                    else if (msgType === "audio" || msgType === "voice") previewText = "🎤 Voice message";

                    await sendPushNotification(
                        receiver.pushToken,
                        senderName,
                        previewText,
                        {
                            type: "new_message",
                            senderId,
                            messageId: newMessage._id.toString()
                        }
                    );
                }
            } catch (pushErr) {
                console.error("Push notification error:", pushErr.message);
            }
        }

        return {
            success: true,
            message: "Message sent",
            data: populatedMessage
        };

    } catch (error) {
        reply.code(500).send({
            success: false,
            message: error.message
        });
    }
};

// ─── Get Messages (Paginated) ───
export const getMessages = async (request, reply) => {
    try {
        const { senderId, receiverId } = request.params;
        const { page = 1, limit = 50 } = request.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination info
        const totalCount = await UserMessage.countDocuments({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            // Exclude messages deleted "for me" by this user
            deletedFor: { $ne: senderId }
        });

        const messages = await UserMessage.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            deletedFor: { $ne: senderId }
        })
            .sort({ createdAt: -1 })  // newest first for pagination
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Reverse to get chronological order for display
        messages.reverse();

        // Populate replyTo messages
        const replyIds = messages
            .filter(m => m.replyTo)
            .map(m => m.replyTo);

        if (replyIds.length > 0) {
            const repliedMessages = await UserMessage.find({
                _id: { $in: replyIds }
            }).select("message senderId isDeleted").lean();

            const replyMap = {};
            repliedMessages.forEach(rm => {
                replyMap[rm._id.toString()] = rm;
            });

            messages.forEach(m => {
                if (m.replyTo) {
                    m.replyToMessage = replyMap[m.replyTo.toString()] || null;
                }
            });
        }

        return {
            success: true,
            messages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                hasMore: skip + limitNum < totalCount
            }
        };

    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

// ─── Get Conversations List (Chat Inbox) ───
export const getConversations = async (request, reply) => {
    try {
        const { userId } = request.params;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Aggregate to get last message + unread count per conversation
        const conversations = await UserMessage.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userObjectId },
                        { receiverId: userObjectId }
                    ],
                    deletedFor: { $ne: userObjectId }
                }
            },
            {
                // Determine the "other" user in each message
                $addFields: {
                    otherUserId: {
                        $cond: {
                            if: { $eq: ["$senderId", userObjectId] },
                            then: "$receiverId",
                            else: "$senderId"
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$otherUserId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", userObjectId] },
                                        { $ne: ["$status", "read"] },
                                        { $ne: ["$isDeleted", true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { "lastMessage.createdAt": -1 } },
            {
                // Lookup the other user's profile info
                $lookup: {
                    from: "mastusers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    _id: 1,
                    lastMessage: {
                        _id: "$lastMessage._id",
                        message: "$lastMessage.message",
                        senderId: "$lastMessage.senderId",
                        receiverId: "$lastMessage.receiverId",
                        status: "$lastMessage.status",
                        isDeleted: "$lastMessage.isDeleted",
                        createdAt: "$lastMessage.createdAt"
                    },
                    unreadCount: 1,
                    userInfo: {
                        _id: "$userInfo._id",
                        username: "$userInfo.username",
                        name: "$userInfo.name",
                        profilePic: "$userInfo.profilePic",
                        about: "$userInfo.about"
                    }
                }
            }
        ]);

        return {
            success: true,
            conversations
        };

    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

// ─── Mark Messages as Read ───
export const markAsRead = async (request, reply) => {
    try {
        const { messageIds, readerId } = request.body;

        if (!messageIds || messageIds.length === 0) {
            return { success: true, message: "No messages to mark" };
        }

        await UserMessage.updateMany(
            {
                _id: { $in: messageIds },
                receiverId: readerId,
                status: { $ne: "read" }
            },
            { status: "read" }
        );

        return {
            success: true,
            message: "Messages marked as read"
        };

    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

// ─── Delete Message ───
export const deleteMessage = async (request, reply) => {
    try {
        const { messageId } = request.params;
        const { userId, deleteForEveryone } = request.body;

        if (deleteForEveryone) {
            await UserMessage.findByIdAndUpdate(messageId, {
                isDeleted: true,
                message: "This message was deleted"
            });
        } else {
            await UserMessage.findByIdAndUpdate(messageId, {
                $addToSet: { deletedFor: userId }
            });
        }

        return {
            success: true,
            message: "Message deleted"
        };

    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

// ─── Mark All Pending Messages as Delivered (called when app comes to foreground) ───
export const markAsDelivered = async (request, reply) => {
    try {
        const { userId } = request.body;

        if (!userId) {
            return reply.code(400).send({ success: false, message: "userId is required" });
        }

        // Find all "sent" messages for this user
        const pendingMessages = await UserMessage.find({
            receiverId: userId,
            status: "sent",
            isDeleted: false
        }).lean();

        if (pendingMessages.length === 0) {
            return { success: true, message: "No pending messages", delivered: 0 };
        }

        // Update all to delivered
        const messageIds = pendingMessages.map(m => m._id);
        await UserMessage.updateMany(
            { _id: { $in: messageIds } },
            { status: "delivered" }
        );

        // Notify each sender about delivery via socket
        const senderGroups = {};
        pendingMessages.forEach(msg => {
            const sid = msg.senderId.toString();
            if (!senderGroups[sid]) senderGroups[sid] = [];
            senderGroups[sid].push(msg._id.toString());
        });

        Object.entries(senderGroups).forEach(([senderId, msgIds]) => {
            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                msgIds.forEach(msgId => {
                    io.to(senderSocketId).emit("message_status_update", {
                        messageId: msgId,
                        status: "delivered"
                    });
                });
            }
        });

        return {
            success: true,
            message: "Messages marked as delivered",
            delivered: messageIds.length
        };

    } catch (error) {
        reply.code(500).send({ success: false, message: error.message });
    }
};

// ─── Upload Media to Cloudinary ───
export const uploadMedia = async (request, reply) => {
    try {
        const file = await request.file();

        if (!file) {
            return reply.code(400).send({ success: false, message: "No file provided" });
        }

        // Read file buffer
        const chunks = [];
        for await (const chunk of file.file) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Determine resource type based on mimetype
        let resourceType = "auto";
        let folder = "talksy/media";

        if (file.mimetype.startsWith("image/")) {
            resourceType = "image";
            folder = "talksy/images";
        } else if (file.mimetype.startsWith("video/")) {
            resourceType = "video";
            folder = "talksy/videos";
        } else if (file.mimetype.startsWith("audio/")) {
            resourceType = "video"; // Cloudinary treats audio as video resource type
            folder = "talksy/audio";
        }

        const result = await uploadToCloudinary(buffer, folder, resourceType);

        return {
            success: true,
            data: {
                url: result.url,
                format: result.format,
                size: result.bytes,
                duration: result.duration,
                width: result.width,
                height: result.height,
            }
        };

    } catch (error) {
        console.error("Upload error:", error);
        reply.code(500).send({ success: false, message: error.message });
    }
};