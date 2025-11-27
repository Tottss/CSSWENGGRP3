export const showResourceHub = async (req, res) => {
  res.render("resourcehub", {
    title: "Resource Hub",
    imageURL: req.session.imageURL,
    NotAdmin: req.session.is_admin ? 0 : 1,
  });
};
