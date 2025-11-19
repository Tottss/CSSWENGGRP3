import {
  UpdateCommand,
  PutCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showEditProfile = async (req, res) => {
  res.render("profiledit", {
    // ImageURL: req.session.ImageURL,
    isRequired: false,
    user: req.session.user,
  });
};

export const showViewProfile = async (req, res) => {
  const partner_id = req.session.partner_id;

  if (!partner_id) return res.redirect("/login"); // avoid fallback in production

  try {
    const [partnerScan, contactScan, locationScan] = await Promise.all([
      docClient.send(
        new ScanCommand({
          TableName: "PartnerOrg",
          FilterExpression: "partner_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: "ContactPerson",
          FilterExpression: "contact_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
      docClient.send(
        new ScanCommand({
          TableName: "Location",
          FilterExpression: "location_id = :pid",
          ExpressionAttributeValues: { ":pid": partner_id },
        })
      ),
    ]);

    const partner = partnerScan.Items?.[0] || {};
    const contact = contactScan.Items?.[0] || {};
    const location = locationScan.Items?.[0] || {};

    const user = {
      ImageURL: partner.profile_picture,
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
    // if (!user) return res.status(401).send("Unauthorized");

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

    const imageURL = req.file ? `/uploads/${req.file.filename}` : user.ImageURL;

    await Promise.all([
      docClient.send(
        new UpdateCommand({
          TableName: "PartnerOrg",
          Key: { partner_id },
          UpdateExpression: `SET partner_name = :name, partner_email = :email, partner_type = :ptype, advocacy_focus = :adv, profile_picture = :img`,
          ExpressionAttributeValues: {
            ":name": orgName,
            ":email": email,
            ":ptype": partnerType,
            ":adv": advocacy,
            ":img": imageURL,
          },
        })
      ),
      docClient.send(
        new UpdateCommand({
          TableName: "ContactPerson",
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
          TableName: "Location",
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
      partnertype: partnerType,
      advocacy,
      contactname: contactName,
      contactposition: contactPosition,
      contactnumber: contactNumber,
      address: fullAddress,
      province,
      municipality,
      barangay,
      ImageURL: imageURL,
    };

    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Failed to update profile");
  }
};
