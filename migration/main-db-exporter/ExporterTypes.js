"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ONE_ON_ONE_CONV_TYPE = 1;
exports.GROUP_CONV_TYPE = 2;
exports.CHAT_MESSAGE_TYPE = 61;
exports.CONTACT_SHARE_MESSAGE_TYPE = 63;
exports.SMS_MESSAGE_TYPE = 64;
exports.VOICE_MAIL_MESSAGE_TYPE = 67;
exports.FILE_SENT_MESSAGE_TYPE = 68;
exports.IMAGE_SHARED_MESSAGE_TYPE = 201;
exports.LOCATION_SHARED_MESSAGE_TYPE = 202;
exports.VIDEO_SHARED_MESSAGE_TYPE = 253;
exports.FILE_SHARED_MESSAGE_TYPE = 254;
exports.VIDEO_MESSAGE_MESSAGE_TYPE = 255;
exports.MESSAGE_TYPE_MAP = {};
exports.MESSAGE_TYPE_MAP[exports.CHAT_MESSAGE_TYPE] = 'RichText';
exports.MESSAGE_TYPE_MAP[exports.CONTACT_SHARE_MESSAGE_TYPE] = 'RichText/Contacts';
exports.MESSAGE_TYPE_MAP[exports.SMS_MESSAGE_TYPE] = 'RichText/Sms';
exports.MESSAGE_TYPE_MAP[exports.VOICE_MAIL_MESSAGE_TYPE] = 'Event/VoiceMail';
exports.MESSAGE_TYPE_MAP[exports.FILE_SENT_MESSAGE_TYPE] = 'RichText/Media_GenericFile';
exports.MESSAGE_TYPE_MAP[exports.IMAGE_SHARED_MESSAGE_TYPE] = 'RichText/UriObject';
exports.MESSAGE_TYPE_MAP[exports.LOCATION_SHARED_MESSAGE_TYPE] = 'Text/Location';
exports.MESSAGE_TYPE_MAP[exports.VIDEO_SHARED_MESSAGE_TYPE] = 'RichText/Media_FlikMsg';
exports.MESSAGE_TYPE_MAP[exports.FILE_SHARED_MESSAGE_TYPE] = 'RichText/Media_GenericFile';
exports.MESSAGE_TYPE_MAP[exports.VIDEO_MESSAGE_MESSAGE_TYPE] = 'RichText/Media_Video';
