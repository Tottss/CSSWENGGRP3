import { UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Client.js";

export const showEditPassword = async (req, res) => {
  res.render("editpassword", { imageURL: req.session.imageURL });
};

export const showEditProfile = async (req, res) => {
  // admin view of edit profile to be implemented later
  if (req.session.is_admin) {
    return res.status(403).send("Admin Edit Profile To Be Implemented Soon.");
  }

  console.log("Session: ", req.session);

  res.render("profiledit", {
    imageURL: req.session.user.imageURL,
    isRequired: false,
    user: req.session.user,
  });
};

export const showViewProfile = async (req, res) => {
  // admin view of profile to be implemented later
  if (req.session.is_admin) {
    return res.status(403).send("Admin Profile View To Be Implemented Soon.");
  }

  const partner_id = req.session.partner_id;

  if (!partner_id) return res.redirect("/login"); // avoid fallback in production

  try {
    const [partnerScan, contactScan, locationScan] = await Promise.all([
      docClient.send(
        new ScanCommand({
          TableName: process.env.PARTNER_ORG_TABLE,
          FilterExpression: "partner_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: process.env.CONTACT_PERSON_TABLE,
          FilterExpression: "contact_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: process.env.LOCATION_TABLE,
          FilterExpression: "location_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
    ]);

    const partner = partnerScan.Items?.[0] || {};
    const contact = contactScan.Items?.[0] || {};
    const location = locationScan.Items?.[0] || {};

    const user = {
      imageURL: partner.profile_picture,
      orgname: partner.partner_name,
      email: partner.partner_email,
      partnertype: partner.partner_type,
      advocacy: partner.advocacy_focus,
      contactname: contact.contact_name,
      contactposition: contact.contact_position,
      contactnumber: contact.contact_number,
      address: location.full_address,
      province: location.province,
      municipality: location.municipality,
      barangay: location.barangay,
    };

    req.session.user = user;

    res.render("profileview", { ...user, AccOwner: true });
  } catch (err) {
    console.error("Error fetching profile data:", err);
    res.status(500).send("Server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = req.session.user;

    const partner_id = req.session.partner_id;

    const {
      orgName,
      contactName,
      contactPosition,
      contactNumber,
      email,
      fullAddress,
      province,
      municipality,
      barangay,
      partnerType,
      advocacy,
    } = req.body;

    let fileUrl = user.imageURL; // keep old image if no new file
    let partner_type = partnerType; // from req.body

    // If partnerType wasn’t changed (or wasn't sent), keep the old one
    if (!partnerType || partnerType === user.partnertype) {
      partner_type = user.partnertype;
    }

    const file = req.file;

    // upload image to s3
    if (file) {
      const BUCKET_NAME = "proposals-storage";
      const fileKey = `images/${partner_id}-${Date.now()}-${file.originalname}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    }

    await Promise.all([
      docClient.send(
        new UpdateCommand({
          TableName: process.env.PARTNER_ORG_TABLE,
          Key: { partner_id },
          UpdateExpression: `SET partner_name = :name, partner_email = :email, partner_type = :ptype, advocacy_focus = :adv, profile_picture = :img`,
          ExpressionAttributeValues: {
            ":name": orgName,
            ":email": email,
            ":ptype": partner_type,
            ":adv": advocacy,
            ":img": fileUrl,
          },
        })
      ),
      docClient.send(
        new UpdateCommand({
          TableName: process.env.CONTACT_PERSON_TABLE,
          Key: { contact_id: partner_id },
          UpdateExpression: `SET contact_name = :cname, contact_position = :cpos, contact_number = :cnum`,
          ExpressionAttributeValues: {
            ":cname": contactName,
            ":cpos": contactPosition,
            ":cnum": contactNumber,
          },
        })
      ),
      docClient.send(
        new UpdateCommand({
          TableName: process.env.LOCATION_TABLE,
          Key: { location_id: partner_id },
          UpdateExpression: `SET full_address = :addr, province = :prov, municipality = :mun, barangay = :brgy`,
          ExpressionAttributeValues: {
            ":addr": fullAddress,
            ":prov": province,
            ":mun": municipality,
            ":brgy": barangay,
          },
        })
      ),
    ]);

    req.session.user = {
      ...user,
      orgname: orgName,
      email,
      partnertype: partner_type,
      advocacy,
      contactname: contactName,
      contactposition: contactPosition,
      contactnumber: contactNumber,
      address: fullAddress,
      province,
      municipality,
      barangay,
      ImageURL: fileUrl,
    };

    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Failed to update profile");
  }
};
