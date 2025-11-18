export const showApplyPage = async (req, res) => {
  res.render("apply", {
    title: "Application Page",
    layout: false,
    isRequired: true,
  });
};
