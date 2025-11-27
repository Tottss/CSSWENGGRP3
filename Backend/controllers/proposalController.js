export const showProposal = async (req, res) => {
  res.render("proposal", {
    title: "Project Proposal",
    imageURL: req.session.imageURL,
    NotAdmin: req.session.is_admin ? 0 : 1,
  });
};
